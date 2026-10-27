# 空间·脑·设计实验室

Public static website for Space, Cognition & Design Lab.

Version: 20261027-copy-trim-1

Site: https://wen2417918951-star.github.io/space-cognition-design-lab/

The interface uses black, white and gray; research images retain their original colors.
The site includes research, projects, student work, publications and the Research Figure Atlas.
Home selections return to the selected image or paper. In-page browser history preserves reading position and archive filters. Each student work detail has a paginated review book exported from the original PPT/PDF pages, with previous/next controls, page selection, keyboard and touch navigation, full-screen reading and session reading-position recovery. Repeated image galleries and their lightbox entry have been removed from student work details. Source page order and content are preserved.
Photographic hero captions retain light text when hovered, with a magenta arrow as the interaction cue.
Mindscape Lab, Focus and Studio link to their online sites from the home product cards, project cards and project details. Project introductions and previews remain available.

This repository contains only public website files. Image, publication, font and bundled-library rights remain with their respective owners; bundled license notices are retained.


Student review books now use a locally hosted MIT-licensed StPageFlip 2.0.7 reader with draggable paper folds, dynamic shadows, large single-page reading and optional desktop spreads. Original pages and page order remain unchanged. Keyboard, touch, full-screen and session reading positions are retained. Local lifecycle, final-spread and portrait-drag adjustments are documented in vendor/page-flip/NOTICE.md.

Research themes use a three-card entry: space and experience, cognition and action, and design and prototypes. The entry page keeps the research question and route to each theme visible without repeating the lab name.

Research theme cards use existing local previews from student work and research tools as visual anchors, with low-contrast space, cognition and design symbols, while keeping the research question and route text primary.


Mobile theme navigation keeps the four peer routes on one horizontal tab row, with overflow contained inside the navigation when needed.

Mobile research theme detail pages keep the active theme tab in view when the horizontal tab row opens, including the English narrow-screen layout.

English publication views identify Chinese-language records with the compact label “Original title · Chinese”; Chinese views keep the publication layout unchanged. The label appears in the English home preview, publication archive and publication detail so readers can distinguish an original Chinese title from an untranslated interface string.

Online product entry points: Lab — https://vrjm-experiment-online.onrender.com/login; Focus — https://mindscape-focus.onrender.com/habitat; Studio — https://mindscape-spatial.onrender.com/.

Project details return to their originating About or research theme section. English atlas controls use translated category labels while original paper titles, figures, and collection notes retain their source language. Product descriptions state their purpose and current capabilities directly.

Paper previews on research pages retain their research theme as the return destination. Paper detail breadcrumbs, related-paper navigation, reloads and return focus preserve that context. Archive searches and home previews retain their existing destinations.

The review book toolbar opens its current page in a zoomable detail viewer. Pan, pinch and zoom use the existing PhotoSwipe library. Closing returns to the book at the viewed page, without a second image gallery below the book.

Opening a figure adds one browser history entry. Back closes it to the existing filtered grid; Forward restores the viewed figure. Same-paper browsing replaces that entry, and direct shared links close within the atlas.

Compact navigation follows its toggle in keyboard order, closes on outside interaction or focus leaving, restores focus on Escape, and resets when switching between compact and desktop layouts.
