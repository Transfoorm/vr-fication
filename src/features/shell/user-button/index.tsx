/**──────────────────────────────────────────────────────────────────────┐
│  👤 USER BUTTON - Avatar + Dropdown Menu                              │
│  /src/features/shell/user-button/index.tsx                            │
│                                                                        │
│  Complete user profile management with avatar upload/crop.             │
│  Pure CSS styling with FUSE-STYLE architecture.                        │
│                                                                        │
│  ISVEA COMPLIANCE: ✅ 100% GOLD STANDARD                               │
│  - 0 ISV violations                                                    │
│  - 0 inline styles                                                     │
│  - 100% compliance (TRUE ZERO inline styles)                          │
│                                                                        │
│  FEATURES:                                                             │
│  - Avatar with upload/crop functionality                               │
│  - Dropdown menu with account actions                                  │
│  - Email verification status                                           │
│  - Error messaging                                                     │
│  - Optimistic UI updates                                               │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useConvex } from "convex/react";
import { signOutAction } from '@/app/(auth)/actions/sign-out';
import dynamic from 'next/dynamic';

// Lazy load Cropper to prevent main thread blocking when opening photo modal
const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <div className="ft-userbutton-cropper-loading"><T.body>Loading editor...</T.body></div>
});
import { api } from '@/convex/_generated/api';
import { refreshSessionAfterUpload } from '@/app/actions/user-mutations';
import { Id } from "@/convex/_generated/dataModel";
import { useFuse } from "@/store/fuse";
import { Icon, Tooltip, Backdrop, T, Spinner } from "@/vr";
import { Button } from "@/vr/button";
import ThemeToggle from '@/features/shell/theme-toggle';

export default function UserButton() {
  const user = useFuse((s) => s.user);
  const navigate = useFuse((s) => s.navigate);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl.generateUploadUrl);
  const uploadAvatar = useMutation(api.identity.uploadAvatar.uploadAvatar);
  const convex = useConvex();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const [committedUrl, setCommittedUrl] = useState<string | null>(null);
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

    // Resize to max 400x400 for avatars (TTT Ready: keeps file sizes small)
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
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
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
      }, "image/jpeg", 0.8); // 80% quality for smaller file sizes
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setIsFilePickerOpen(false);
    setErrorMessage(null);
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Only image files are allowed. Please select a JPG, PNG, or GIF.");
      setShowUserMenu(true); // Reopen menu to show error
      return;
    }

    // No size limit needed - cropping auto-resizes to 400x400 @ 80% quality
    setSelectedFile(file);
    setShowUserMenu(false);
    setShowProfileModal(true);
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
        const img = await createImage(URL.createObjectURL(croppedBlob));
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const whiteBgBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(blob => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas export failed"));
          }, "image/jpeg");
        });

        fileToUpload = new File([whiteBgBlob], "avatar.jpg", { type: "image/jpeg" });
        optimisticBlobUrl = URL.createObjectURL(whiteBgBlob);
      }

      if (!fileToUpload) {
        throw new Error("No image to upload");
      }

      const currentAvatar = optimisticUrl || committedUrl || user?.avatarUrl || "/images/sitewide/avatar.png";
      setPreviousUrl(currentAvatar);
      if (optimisticBlobUrl) {
        setOptimisticUrl(optimisticBlobUrl);
      }

      setIsCropping(false);
      setSelectedFile(null);
      setShowProfileModal(false);
      setIsUploading(true);

      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      console.log('🔍 [UPLOAD] Requesting upload URL for userId:', user!.id);
      const url = await generateUploadUrl({ userId: user!.id as import('@/convex/_generated/dataModel').Id<"admin_users"> });
      console.log('🔍 [UPLOAD] Received upload URL:', url);

      if (!url) {
        throw new Error("Failed to generate upload URL");
      }

      console.log('🔍 [UPLOAD] Uploading file, size:', fileToUpload.size, 'bytes');
      // eslint-disable-next-line no-restricted-globals -- VRP Exception: Convex-generated signed upload URL (not external API)
      const uploadRes = await fetch(url, {
        method: "POST",
        body: fileToUpload,
      });
      console.log('🔍 [UPLOAD] Upload response status:', uploadRes.status, uploadRes.statusText);

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);

      const { storageId } = await uploadRes.json();
      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      await uploadAvatar({ fileId: storageId, userId: user!.id as Id<"admin_users"> });
      const newAvatarUrl = await waitForImageUrl(storageId);

      setCommittedUrl(newAvatarUrl);
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
          id: String(freshUser._id),         // ✅ SOVEREIGNTY: Convex _id (canonical)
          convexId: String(freshUser._id),   // Explicit alias
          clerkId: user!.clerkId,            // Preserve from existing FUSE state
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
        console.log('✅ FUSE store updated with new avatar:', freshUser.avatarUrl?.substring(0, 50));
      }

      // Refresh session cookie with new avatar
      await refreshSessionAfterUpload();
    } catch (err) {
      console.error("Upload failed:", err);
      setErrorMessage("Upload failed. Please try again.");
      setShowUserMenu(true);
      if (previousUrl) {
        setOptimisticUrl(null);
        if (optimisticUrl) {
          URL.revokeObjectURL(optimisticUrl);
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    // Show loading overlay while server action executes
    setIsSigningOut(true);

    // FUSE 6.0 Logout Flow - Sovereign Auth Boundary:
    // Server Action handles: Clerk session revoke + cookie delete
    await signOutAction();

    // Clear sidebar state so fresh login starts with collapsed sections
    // Clear BOTH keys (legacy cleanup - there were two different keys used)
    localStorage.removeItem('fuse-sidebar-sections');
    localStorage.removeItem('sidebar-expanded-sections');
    // Clear user ID so next login triggers fresh sidebar state
    localStorage.removeItem('fuse-last-user-id');

    // Client-side redirect (server can't delete httpOnly cookies properly)
    window.location.href = '/sign-in';
  };

  const avatarSrc = optimisticUrl || committedUrl || user?.avatarUrl || "/images/sitewide/avatar.png";

  // Check if user has a custom avatar (not the default)
  const hasCustomAvatar = user?.avatarUrl && user.avatarUrl !== "/images/sitewide/avatar.png";

  // Animated menu close (scale-out effect)
  const closeMenu = () => {
    setIsMenuClosing(true);
    setTimeout(() => {
      setShowUserMenu(false);
      setIsMenuClosing(false);
    }, 130); // Unmount before animation ends to prevent flash
  };

  const closeAllModals = () => {
    // Close instantly without animation
    setShowUserMenu(false);
    setIsMenuClosing(false);
    setShowProfileModal(false);
    setIsModalClosing(false);
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const isActive = showUserMenu || showProfileModal || isFilePickerOpen;

  if (!user) {
    return <div className="ft-userbutton-loading" />;
  }

  return (
    <div className="ft-userbutton-container">
      <div
        onClick={() => {
          if (showProfileModal) {
            closeAllModals(); // Instant close for modal
          } else if (showUserMenu) {
            closeMenu(); // Animated close for menu
          } else if (!isUploading) {
            setShowUserMenu(true);
          }
        }}
        className="ft-userbutton-avatar-wrapper"
      >
        <img
          src={avatarSrc}
          alt="User Avatar"
          className={`ft-userbutton-avatar ${isActive ? 'ft-userbutton-avatar--active' : ''}`}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="ft-userbutton-file-input"
        onChange={handleFileChange}
        onBlur={() => setIsFilePickerOpen(false)}
      />

      {showUserMenu && (
        <div className={`ft-userbutton-menu ${isMenuClosing ? 'ft-userbutton-menu--closing' : ''}`} onClick={(e) => e.stopPropagation()}>
          <button
            className="ft-userbutton-close-button"
            onClick={closeAllModals}
          >
            ×
          </button>

          <div className="ft-userbutton-menu-header" onClick={(e) => e.stopPropagation()}>
            <div className="ft-userbutton-menu-header-content">
              {user.emailVerified ? (
                <img
                  src="/images/sitewide/email-verified.png"
                  alt="Email verified"
                  className="ft-userbutton-menu-header-icon"
                />
              ) : (
                <img
                  src="/images/sitewide/email-unverified.png"
                  alt="Email unverified"
                  className="ft-userbutton-menu-header-icon"
                />
              )}
              <div className="ft-userbutton-menu-header-text">
                <T.body size="sm" className={`ft-userbutton-menu-email ${!user.emailVerified ? 'ft-userbutton-menu-email--unverified' : ''}`}>
                  {user.email}
                </T.body>
                {!user.emailVerified && (
                  <T.caption size="xs" className="ft-userbutton-menu-email-status">
                    Unverified - Setup incomplete
                  </T.caption>
                )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="ft-userbutton-error-container">
              <T.body color="error" className="ft-userbutton-error-text">
                {errorMessage}
              </T.body>
              <div className="ft-userbutton-error-buttons">
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setIsFilePickerOpen(true);
                    requestAnimationFrame(() => {
                      fileInputRef.current?.click();
                    });
                  }}
                  className="ft-userbutton-error-button"
                >
                  <T.caption size="xs" weight="medium">OK</T.caption>
                </button>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    closeMenu();
                  }}
                  className="ft-userbutton-error-button"
                >
                  <T.caption size="xs" weight="medium">Cancel</T.caption>
                </button>
              </div>
            </div>
          )}

          <div className="ft-userbutton-menu-items">
            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  closeAllModals();
                  // Always navigate to Account - page handles freeze + Shadow King
                  navigate('settings/account');
                }}
                className="ft-userbutton-menu-item"
              >
                <Icon variant="user" size="xs" />
                <T.body size="sm">Your Account Details</T.body>
              </button>
            </div>

            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  navigate('settings/preferences');
                  closeAllModals();
                }}
                className="ft-userbutton-menu-item"
              >
                <Icon variant="sparkles" size="xs" />
                <T.body size="sm">Site Preferences</T.body>
              </button>
            </div>

            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  const { toggleThemeMode } = useFuse.getState();
                  toggleThemeMode();
                  closeMenu();
                }}
                className="ft-userbutton-menu-item ft-userbutton-menu-item--theme"
              >
                <ThemeToggle />
                <span className="ft-userbutton-theme-text"><T.body size="sm">Light / Dark Mode</T.body></span>
              </button>
            </div>

            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  navigate('settings/plan');
                  closeAllModals();
                }}
                className="ft-userbutton-menu-item"
              >
                <Icon variant="gem" size="xs" />
                <T.body size="sm">Manage Subscription</T.body>
              </button>
            </div>

            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setIsFilePickerOpen(true);
                  fileInputRef.current?.click();
                }}
                className="ft-userbutton-menu-item"
              >
                <Icon variant="camera" size="xs" />
                <T.body size="sm">{hasCustomAvatar ? 'Change Your Photo' : 'Add Photo'}</T.body>
              </button>
            </div>
          </div>

          <div className="ft-userbutton-menu-divider">
            <div className="ft-userbutton-menu-item-wrapper">
              <button
                onClick={() => {
                  closeAllModals();
                  handleSignOut();
                }}
                className="ft-userbutton-menu-item"
              >
                <Icon variant="logout" size="xs" />
                <T.body size="sm">Log out</T.body>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <>
          <Backdrop onClick={closeAllModals} />
          <div className={`ft-userbutton-modal ${isModalClosing ? 'ft-userbutton-modal--closing' : ''}`}>
            <button
              className="ft-userbutton-close-button"
              onClick={closeAllModals}
            >
              ×
            </button>

            <div className="ft-userbutton-modal-header">
              <T.h3>Resize and crop image</T.h3>
              <Tooltip.caret content="Use your mouse scroll wheel to zoom and adjust image" side="top">
                <Icon variant="info" size="sm" className="ft-userbutton-modal-header-icon" />
              </Tooltip.caret>
            </div>

            {previewUrl && isCropping && (
              <div className="ft-userbutton-cropper-container">
                {/* ISVEA: style prop required by react-easy-crop library */}
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={0}
                  aspect={1}
                  minZoom={0.5}
                  maxZoom={3}
                  cropShape="round"
                  zoomSpeed={1}
                  restrictPosition={false}
                  // ISV-EXCEPTION: react-easy-crop requires style prop with specific shape
                  style={{ containerStyle: {}, mediaStyle: {}, cropAreaStyle: {} }}
                  classes={{}}
                  mediaProps={{}}
                  cropperProps={{}}
                  keyboardStep={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            )}

            <div className="ft-userbutton-upload-actions">
              {previewUrl && (
                <button
                  className={`ft-userbutton-upload-button ${isUploading ? 'ft-userbutton-upload-button--uploading' : ''}`}
                  onClick={() => {
                    if (isUploading) return;
                    handleUpload();
                  }}
                >
                  <T.body size="sm">{isUploading ? "Uploading..." : "Save cropped image"}</T.body>
                </button>
              )}
            </div>
          </div>

        </>
      )}

      {showUserMenu && (
        <div
          className="ft-userbutton-backdrop"
          onClick={() => {
            closeMenu(); // Animated close
            // Also close header menu if open
            const headerMenu = document.querySelector('.ly-sidebar-header-menu');
            if (headerMenu) {
              const headerButton = document.querySelector('.ly-sidebar-header-button') as HTMLElement;
              headerButton?.click();
            }
          }}
        />
      )}

      {/* Sign-out loading overlay */}
      {isSigningOut && (
        <div className="ft-userbutton-signout-overlay">
          <Button.fire
            className="ft-userbutton-signout-button"
            icon={<Spinner size="xs" color="white" />}
            iconPosition="left"
          >
            <T.body>Logging you out securely...</T.body>
          </Button.fire>
        </div>
      )}
    </div>
  );
}
