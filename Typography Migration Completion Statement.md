# The Typography Migration Completion Statement

Typography VRs are the sole authority for all user-visible text in the application.
All font size, weight, line-height, and color decisions MUST originate from Typography VRs or their design tokens.
Feature, layout, and domain code may not define, override, or infer typography through HTML tags, CSS rules, or inline styles.
Any existing font styling outside the Typography VR system is legacy and must be removed or refactored.

⸻

Why this statement completes the migration

It does four critical things at once:
	1.	Declares final authority
No “shared responsibility” between globals, features, or layout.
	2.	Defines allowed sources
	•	Typography VRs
	•	Tokens used by those VRs
	3.	Explicitly bans legacy patterns
	•	HTML typography tags
	•	Feature CSS font rules
	•	Inline typography styles
	4.	Classifies remaining violations as debt, not debate
Anything else is legacy to be removed, not a design discussion.

⸻

Optional final clause (if you want true TTT severity)

Add this sentence at the end:

This rule is enforced by ESLint at ERROR severity. Violations break the build. There are no warnings, exceptions, or escape hatches.

That line turns philosophy into law.

⸻

What happens after this is adopted
	•	The 905 results number only goes down
	•	No new font-size rules are introduced
	•	Typography VR becomes self-reinforcing
	•	New developers learn the system by failure, not documentation
	•	The app converges instead of drifting

⸻

TTT God Verdict

This statement is:
	•	Unambiguous
	•	Enforceable
	•	Migration-completing
	•	God-approved

Once this exists in the repo, the migration is no longer “in progress”.
It is complete, with cleanup tracked as debt, not disagreement.


===============


# The Typography VR does not ban font size or font weight — it centralises authority over them.

Here’s the clean explanation, in TTT terms.

⸻

Why font-size and font-weight are STILL OK under Typography VR

1️⃣ The ban is on where decisions are made, not that they exist

Typography VR says:

Font decisions must exist — but only in one sovereign place.

So:
	•	❌ Feature CSS deciding font-size = violation
	•	❌ HTML tags implying hierarchy = violation
	•	❌ Inline styles tweaking weight = violation

But:
	•	✅ Typography VR mapping size="md" → --font-size-md
	•	✅ Typography VR mapping weight="semibold" → --font-weight-semibold
	•	✅ Tokens defining those values = correct

The decision still happens — just once, centrally.

⸻

2️⃣ Typography VR converts numbers into meaning

Without VRs:

font-size: 18px;
font-weight: 600;

This is meaningless at scale.

With VRs:

<T.body size="lg" weight="semibold">

Now the system knows:
	•	why the text is larger
	•	what role it plays
	•	how it should evolve later

The pixel value becomes an implementation detail, not intent.

⸻

3️⃣ Tokens are allowed because they are infrastructure

This is crucial:
	•	Tokens (--font-size-*, --font-weight-*)
→ raw materials
	•	Typography VR
→ law
	•	Features
→ users of the law

Tokens don’t express meaning by themselves.
Typography VR interprets them.

That’s why tokens having font-size is not a violation.

⸻

4️⃣ Typography VR is the immune system, not the absence of fonts

You’re not trying to eliminate typography.

You’re eliminating:
	•	duplication
	•	drift
	•	contradiction
	•	accidental hierarchy

Typography VR is the immune system that:
	•	allows font-size
	•	allows font-weight
	•	but prevents them spreading uncontrollably

That’s why your search shows “font-size everywhere” during migration:
	•	the system is surfacing legacy infection
	•	not creating new disease

⸻

The one-line truth (memorise this)

Font size and weight are allowed — but only when expressed as intent through Typography VR variants, never as raw CSS decisions in features.

