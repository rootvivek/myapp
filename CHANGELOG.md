# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2026-10-08

### Fixed
- Input field heights now match search bar (44dp) globally
- Removed "Attach Inventory Part" & "Choose from Folder" buttons from problem section

### Changed
- All text inputs unified to fixed 44dp height with 16dp border radius
- Dense inputs: 36dp
- Problem section simplified (only description + shortcut chips)

---

## [1.0.8] - 2026-10-08

### Fixed
- Card double border issue (AppCard uses contained mode)
- FAB plus icon centering in bottom nav
- Filter chips spacing and alignment
- Search bar full-width layout
- Header/filter/card left-right alignment (16px padding)

### Changed
- Uniform card padding reduced to 8px (was 16px)
- Badge/chip size reduced (minHeight 22, fontSize 11)
- Status flow: Pending → In Progress → Completed → Delivered
- Repair card: larger image (90×90), larger text (14px), more spacing
- Customer name + order ID on same row in card
- "Added by" only shows for labour entries
- Removed paid/unpaid chip from repair card

### Added
- Labels under bottom nav tabs (Home, Inventory, Finance, User)
- Down arrow on status pill indicating tap-to-change
- GitHub Releases upload for large APKs (>50MB)
- Release automation script (`scripts/release-android.js`)

---

## [1.0.7] - 2026-10-07

### Fixed
- Double border on repair cards (AppCard now uses contained mode for outlined variant)
- FAB plus icon not centered in bottom nav bar
- Inconsistent card padding (now uniform on all sides)
- Removed "Cancelled" status from repair flow
- Removed "Set & Notify via WhatsApp" buttons for Completed/Delivered statuses
- Removed Cancel button from Status Modal

### Changed
- Status flow simplified: Pending → In Progress → Completed → Delivered
- All cards now use consistent spacing from design system

### Added
- Release automation script (`scripts/release-android.js`)

---

## [1.0.6] - 2026-09-XX

### Added
- Auto-update feature with Supabase backend
- OTP authentication via MSG91
- Customer history modal
- Repair photo upload with thumbnails

### Fixed
- Various UI polish and bug fixes

---

## [1.0.5] - 2026-08-XX

### Added
- Initial release
- Repair management (create, edit, status tracking)
- Inventory management
- Finance dashboard
- Team management
- Settings (appearance, profile, branding)