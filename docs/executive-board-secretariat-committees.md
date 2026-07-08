## Implementation Plan — Executive Board, Secretariat Split, and Committees Enhancements

### What we are building
We are adding a new public Executive Board experience and separating Secretariat into its own dedicated page with committee-linked chairs. The admin panel will manage both datasets independently: EB members (photo, name, title, description, publish/order) and Secretariat members (photo, name, title, description, assigned committee, publish/order). On the public site, homepage will remove the current Secretariat preview and replace it with an EB reveal section, while committees page will be upgraded to include committee logos, a controlled study-guide download button (activated by EB from admin), and a View Secretariat button.

### Language we agreed on
- Executive Board (EB) page: New public page at `/eb` showing EB member profiles from admin.
- Secretariat: Separate public page at `/secretariat`, no longer represented as the homepage preview block.
- Secretariat are chairs: Secretariat members are chair records that must include one assigned committee per member.
- EB reveal on homepage: Homepage section featuring EB members and linking to full `/eb`.
- Study guide activation: Download button appears only when a guide is uploaded and an admin toggle enables it.
- View secretariat button: Button on committees page linking to `/secretariat`.

### Decisions made
- One committee per secretariat member: We will implement a single committee assignment field per secretariat member to match chair ownership and keep admin UX clean.
- Separate data models for EB and Secretariat: We will create independent admin/public datasets so roles do not get conflated and content remains manageable.
- Route choices: Keep `/secretariat`, add `/eb` titled "Executive Board".
- Homepage composition: Remove Secretariat preview section and add EB reveal (4 featured members + CTA).
- Committees enhancements: Add committee logo support, study guide enable toggle, and View Secretariat CTA.
- Toggle logic for study guide: Public download button shown only when `study_guide_path` exists and `study_guide_enabled` is true.
- Descriptions on both people models: EB and Secretariat entries both support long description in admin and public rendering.
- Admin IA: Add `EB` tab while keeping `Secretariat` tab.
- Data continuity: Extend current secretariat schema instead of replacing it.

### Assumptions
- Existing storage bucket and upload pattern for portraits can be reused for EB portraits (new bucket path but same upload architecture).
- Committee logos will use Supabase storage similar to sponsors/study guides.
- Showing 4 EB members on homepage means first 4 published by display order.
- Existing home CTA/nav patterns remain visually consistent with current design tokens.
- No URL slug is needed per member profile page in this iteration (list pages only).

### How to build it
1. Add DB migration to create `eb_members`, extend `secretariat_members`, and extend `committees` with logo and study-guide toggle fields.
2. Update TypeScript types for new and extended fields.
3. Implement admin server actions for EB CRUD/uploads, secretariat committee assignment/description, and committee logo + study-guide toggles.
4. Build admin UI for new EB tab/page and updated Secretariat/Committee forms.
5. Extend public query layer for EB, enriched secretariat, and enriched committee records.
6. Build new `/eb` page.
7. Update `/secretariat` with description + assigned committee.
8. Replace homepage secretariat preview with EB reveal.
9. Update `/committees` with logos, conditional download, and View Secretariat button.
10. Revalidate paths and run lint/build checks.
