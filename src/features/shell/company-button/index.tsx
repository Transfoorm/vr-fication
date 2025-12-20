/**──────────────────────────────────────────────────────────────────────┐
│  🏢 COMPANY BUTTON - Entity Details + Logo Cropper + Dropdown Menu  │
│  /src/features/shell/company-button/index.tsx                        │
│                                                                        │
│  Company/Entity selector with brand logo upload/crop, subscription   │
│  status, and quick access to entity settings.                        │
│                                                                        │
│  ARCHITECTURE: Logo cropper built-in (same pattern as UserButton)    │
│  - Optimistic UI updates                                              │
│  - Three-tier persistent state                                        │
│  - No flash on refresh                                                │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronsUpDown, Edit } from 'lucide-react';
import { useMutation, useConvex } from 'convex/react';
import Cropper from 'react-easy-crop';
import { api } from '@/convex/_generated/api';
import { refreshSessionAfterUpload } from '@/app/actions/user-mutations';
import { Id } from '@/convex/_generated/dataModel';
import CountrySelector from '@/features/shell/country-selector';
import { useFuse } from '@/store/fuse';
import { Icon, Tooltip, Backdrop, T } from '@/prebuilts';
import { formatSubscriptionStatus, type SubscriptionStatus } from '@/fuse/constants/ranks';

export default function CompanyButton() {
  const user = useFuse((s) => s.user);
  const navigate = useFuse((s) => s.navigate);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const businessLocationButtonRef = useRef<HTMLButtonElement>(null);

  // ─────────────────────────────────────────────────────────────────────
  // LOGO CROPPER STATE (merged from CompanyLogoCropper)
  // ─────────────────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl.generateUploadUrl);
  const uploadBrandLogo = useMutation(api.identity.uploadBrandLogo.uploadBrandLogo);
  const convex = useConvex();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropperModal, setShowCropperModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Three-tier persistent state (exact same pattern as UserButton)
  const [committedUrl, setCommittedUrl] = useState<string | null>(null);
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  // LOGO CROPPER FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────
  const waitForImageUrl = async (storageId: Id<"_storage">) => {
    for (let i = 0; i < 10; i++) {
      const url = await convex.query(api.storage.getImageUrl.getImageUrl, { storageId });
      if (url) return url;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error("Image URL did not hydrate in time");
  };

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const onCropComplete = useCallback((_: { x: number; y: number; width: number; height: number }, croppedPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", error => reject(error));
      img.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    const maxSize = 400;
    let targetWidth = pixelCrop.width;
    let targetHeight = pixelCrop.height;

    if (targetWidth > maxSize || targetHeight > maxSize) {
      const scale = Math.min(maxSize / targetWidth, maxSize / targetHeight);
      targetWidth = Math.round(targetWidth * scale);
      targetHeight = Math.round(targetHeight * scale);
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas export failed"));
      }, "image/png");
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      console.error("Only image files are allowed");
      return;
    }

    setSelectedFile(file);
    setShowCropperModal(true);
    setIsCropping(true);
  };

  const handleUpload = async () => {
    if (!previewUrl && !selectedFile) {
      console.error("Please select an image first");
      return;
    }

    try {
      let fileToUpload: File | null = selectedFile;
      let optimisticBlobUrl: string | null = null;

      if (previewUrl && isCropping && croppedAreaPixels) {
        const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
        fileToUpload = new File([croppedBlob], "companylogo.png", { type: "image/png" });
        optimisticBlobUrl = URL.createObjectURL(croppedBlob);
      }

      if (!fileToUpload) {
        throw new Error("No image to upload");
      }

      const currentLogo = optimisticUrl || committedUrl || user?.brandLogoUrl || "/images/sitewide/enterprise.png";
      setPreviousUrl(currentLogo);
      if (optimisticBlobUrl) {
        setOptimisticUrl(optimisticBlobUrl);
      }

      setIsCropping(false);
      setSelectedFile(null);
      setShowCropperModal(false);
      setIsUploading(true);

      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      console.log('🔍 [LOGO UPLOAD] Requesting upload URL for userId:', user!.id);
      const url = await generateUploadUrl({ userId: user!.id as Id<"admin_users"> });
      console.log('🔍 [LOGO UPLOAD] Received upload URL:', url);

      if (!url) {
        throw new Error("Failed to generate upload URL");
      }

      console.log('🔍 [LOGO UPLOAD] Uploading file, size:', fileToUpload.size, 'bytes');
      // eslint-disable-next-line no-restricted-globals -- VRP Exception: Convex-generated signed upload URL (not external API)
      const uploadRes = await fetch(url, {
        method: "POST",
        body: fileToUpload,
      });
      console.log('🔍 [LOGO UPLOAD] Upload response status:', uploadRes.status, uploadRes.statusText);

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);

      const { storageId } = await uploadRes.json();
      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      await uploadBrandLogo({ fileId: storageId, userId: user!.id as Id<"admin_users"> });
      const newLogoUrl = await waitForImageUrl(storageId);

      setCommittedUrl(newLogoUrl);
      setOptimisticUrl(null);
      setPreviousUrl(null);

      if (optimisticBlobUrl) {
        URL.revokeObjectURL(optimisticBlobUrl);
      }

      // Refresh FUSE store
      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
        userId: user!.id as Id<"admin_users">,
      });
      if (freshUser) {
        const { setUser } = useFuse.getState();
        // 🛡️ S.I.D. Phase 15: clerkId comes from current user state, not Convex query
        setUser({
          id: String(freshUser._id),
          convexId: String(freshUser._id),
          clerkId: user!.clerkId, // Preserve from existing FUSE state
          email: freshUser.email || '',
          firstName: freshUser.firstName,
          lastName: freshUser.lastName,
          avatarUrl: freshUser.avatarUrl,
          brandLogoUrl: freshUser.brandLogoUrl,
          rank: freshUser.rank as 'crew' | 'captain' | 'commodore' | 'admiral' | null | undefined,
          setupStatus: freshUser.setupStatus as 'pending' | 'complete' | null | undefined,
          businessCountry: freshUser.businessCountry,
          entityName: freshUser.entityName,
          socialName: freshUser.socialName,
          mirorAvatarProfile: freshUser.mirorAvatarProfile,
          mirorEnchantmentEnabled: freshUser.mirorEnchantmentEnabled,
          mirorEnchantmentTiming: freshUser.mirorEnchantmentTiming
        });
        console.log('✅ FUSE store updated with new company logo:', freshUser.brandLogoUrl?.substring(0, 50));
      }

      // Refresh session cookie with new logo
      console.log('🔄 Refreshing session cookie...');
      const refreshResult = await refreshSessionAfterUpload();
      console.log('🔄 Session refresh result:', refreshResult);
    } catch (err) {
      console.error("Upload failed:", err);
      if (previousUrl) {
        setOptimisticUrl(null);
        if (optimisticUrl) {
          URL.revokeObjectURL(optimisticUrl);
        }
      }
    } finally {
      setIsUploading(false);
      // Clear file input to prevent browser "unsaved changes" warning (always clear, even on error)
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const closeCropperModal = () => {
    setShowCropperModal(false);
    setSelectedFile(null);
  };

  // Compute logo source with fallback chain
  const logoSrc = optimisticUrl || committedUrl || user?.brandLogoUrl || "/images/sitewide/enterprise.png";

  // ─────────────────────────────────────────────────────────────────────
  // MENU FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────
  const closeMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, 130); // Unmount before animation ends to prevent flash
  };

  const handleButtonClick = () => {
    // Ignore clicks if cropper modal is open
    if (showCropperModal) {
      return;
    }

    // Close UserButton menu if open
    const userButtonAvatar = document.querySelector('.ft-userbutton-avatar--active');
    if (userButtonAvatar) {
      (userButtonAvatar as HTMLElement).click();
    }
    setIsMenuOpen(!isMenuOpen);
  };

  if (!user) {
    return <div className="ft-company-button-loading" />;
  }

  return (
    <div className="ft-company-button-container">
      <button
        className={`ft-company-button ${isMenuOpen ? 'ft-company-button--active' : ''}`}
        onMouseDown={handleButtonClick}
      >
        {/* Logo Display */}
        <img
          src={logoSrc}
          alt="Company Logo"
          width={32}
          height={32}
          className="ft-company-button-logo"
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            console.error('Failed to load company logo:', logoSrc);
            e.currentTarget.src = "/images/sitewide/enterprise.png";
          }}
        />
        <div className="ft-company-button-text">
          <T.body size="sm" weight="semibold" className={`ft-company-button-title ${!user?.entityName ? 'ft-company-button-title--placeholder' : ''}`}>
            {user?.entityName || 'Company Name'}
          </T.body>
          <T.caption size="xs" className="ft-company-button-subtitle">
            {user?.subscriptionStatus ? formatSubscriptionStatus(user.subscriptionStatus as SubscriptionStatus) : 'Trial Period'}
          </T.caption>
        </div>
        <ChevronsUpDown className="ft-company-button-chevron" />
      </button>

      {/* Hidden file input for logo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="ft-company-button-file-input"
        onChange={handleFileChange}
      />

      {isMenuOpen && (
        <>
          <div className={`ft-company-button-menu ${isMenuClosing ? 'ft-company-button-menu--closing' : ''}`}>
            <button
              className="ft-company-button-menu-close"
              onClick={closeMenu}
            >
              ×
            </button>

            <div className="ft-company-button-menu-header">
              <Icon variant="briefcase-business" size="sm" className="ft-company-button-menu-header-icon" />
              <div className="ft-company-button-menu-header-text">
                <T.body size="sm">Your Business Info</T.body>
                {user?.setupStatus !== 'complete' && (
                  <T.caption size="xs" className="ft-company-button-menu-header-status">Setup incomplete</T.caption>
                )}
              </div>
            </div>

            <div className="ft-company-button-menu-content">
              <div className="ft-company-button-menu-item-wrapper">
                <button
                  className="ft-company-button-menu-item"
                  onClick={() => {
                    closeMenu();
                    navigate('settings/account');
                    // Set hash to profile tab, then focus First Name field
                    setTimeout(() => {
                      window.location.hash = 'profile';
                      setTimeout(() => {
                        const input = document.querySelector('[data-field="first-name"]') as HTMLInputElement;
                        input?.focus();
                      }, 50);
                    }, 50);
                  }}
                >
                  <Icon variant="user-pen" size="sm" className="ft-company-button-menu-icon" />
                  <T.body size="sm" className={`ft-company-button-menu-value ${!user?.firstName || !user?.lastName ? 'ft-company-button-menu-value--placeholder' : ''}`}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Your Name Here'}
                  </T.body>
                </button>
              </div>

              <div className="ft-company-button-menu-item-wrapper">
                <button
                  className="ft-company-button-menu-item"
                  onClick={() => {
                    closeMenu();
                    navigate('settings/account');
                    // Set hash after navigate so Tabs.panels can read it
                    setTimeout(() => {
                      window.location.hash = 'genome';
                    }, 50);
                  }}
                >
                  <Icon variant="dna" size="sm" className="ft-company-button-menu-icon" />
                  <T.body size="sm" className={`ft-company-button-menu-value ${user?.setupStatus !== 'complete' ? 'ft-company-button-menu-value--placeholder' : ''}`}>
                    {user?.setupStatus !== 'complete' ? 'Professional Genome' : 'Professional Genome'}
                  </T.body>
                </button>
              </div>

              <div className="ft-company-button-menu-item-wrapper">
                <button
                  ref={businessLocationButtonRef}
                  className="ft-company-button-menu-item"
                  onClick={() => {
                    setShowCountrySelector(true);
                  }}
                >
                  <span className="ft-company-button-menu-icon ft-company-button-menu-flag">
                    {user?.businessCountry === 'AU' ? '🇦🇺' : user?.businessCountry === 'US' ? '🇺🇸' : user?.businessCountry === 'GB' ? '🇬🇧' : '🌍'}
                  </span>
                  <div className="ft-company-button-menu-value"><T.body size="sm">Business Location</T.body></div>
                </button>
              </div>

              <div className="ft-company-button-menu-item-wrapper">
                <button
                  className="ft-company-button-menu-item"
                  onClick={() => {
                    fileInputRef.current?.click();
                    closeMenu();
                  }}
                >
                  <Icon variant="image-plus" size="sm" className="ft-company-button-menu-icon" />
                  <T.body size="sm" className="ft-company-button-menu-value">
                    {user?.brandLogoUrl ? 'Change Your Logo' : 'Add Your Logo'}
                  </T.body>
                </button>
              </div>
            </div>

            <div className="ft-company-button-menu-footer">
              <div className="ft-company-button-menu-link-wrapper">
                <button
                  className="ft-company-button-menu-link"
                  onClick={() => {
                    closeMenu();
                    navigate('settings/account');
                    // Set hash to profile tab
                    setTimeout(() => {
                      window.location.hash = 'profile';
                    }, 50);
                  }}
                >
                  <Edit className="ft-company-button-menu-link-icon" />
                  <T.body size="sm">Update Details</T.body>
                </button>
              </div>
            </div>
          </div>

          <div
            className="ft-company-button-backdrop"
            onClick={() => {
              closeMenu();
              // Also close UserButton menu if open
              const userButtonAvatar = document.querySelector('.ft-userbutton-avatar--active');
              if (userButtonAvatar) {
                (userButtonAvatar as HTMLElement).click();
              }
            }}
          />
        </>
      )}

      {showCountrySelector && (
        <CountrySelector
          align="left"
          triggerRef={businessLocationButtonRef}
          onClose={() => setShowCountrySelector(false)}
        />
      )}

      {/* Logo Cropper Modal */}
      {showCropperModal && typeof document !== 'undefined' && createPortal(
        <>
          <Backdrop onClick={closeCropperModal} />
          <div
            className="ft-company-button-cropper-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ft-company-button-cropper-header">
              <T.h3>
                Resize and crop logo
              </T.h3>
              <Tooltip.caret content="Use your mouse scroll wheel to zoom and adjust image" side="top">
                <Icon variant="info" size="sm" className="ft-company-button-cropper-header-icon" />
              </Tooltip.caret>
            </div>

            {previewUrl && isCropping && (
              <div
                className="ft-company-button-cropper-container"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  minZoom={0.5}
                  maxZoom={3}
                  restrictPosition={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  classes={{
                    cropAreaClassName: 'ft-company-button-crop-area'
                  }}
                />
              </div>
            )}

            <div className="ft-company-button-cropper-actions">
              {previewUrl && (
                <button
                  className={`ft-company-button-cropper-save ${isUploading ? 'ft-company-button-cropper-save--uploading' : ''}`}
                  onClick={() => {
                    if (isUploading) return;
                    handleUpload();
                  }}
                >
                  <T.body>{isUploading ? "Uploading..." : "Save cropped image"}</T.body>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
