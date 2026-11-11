# Folio reader highlights journey

## Application Overview

Highlights in Folio's reader on dev (https://dev.agenticlibrary.app), explored at /read/pride-and-prejudice/chapter-1 with a fresh signed-in e2e user (seed tests/agents/signed-in.seed.ts, lands on /library). Every scenario starts with a fresh user with no highlights. The reader's selection toolbar has these buttons, in order: Highlight, Note, Ask about this, Explain, Translate, Read aloud from here. Only Highlight is in scope. Note, Ask about this, Explain, Translate and Read aloud from here are NOT pressed and are out of scope (third-party or other journeys). The tab panel's "Add note" button is likewise not pressed. FINDINGS: (1) There is NO colour choice. Pressing Highlight applies a single default colour, yellow, immediately, and the toolbar closes. There is no swatch or popover, and clicking an existing highlight does nothing, so colour change is not supported. Colour appears only as the text "Yellow highlight:" (visually hidden label) in the lists and as the CSS Custom Highlight API entry "hl-yellow"; highlights are NOT DOM elements (no mark or span), so a test cannot locate them by role, and can verify them only via the sidebar and account lists (or a screenshot). (2) The toolbar only appears after a real text selection; a plain mouse selection is what real users do, and a programmatic selection needs mouseup/pointerup dispatched on the paragraph. A synthetic dragTo from the paragraph to itself did not select text. (3) Escape does not dismiss the toolbar; clicking elsewhere (e.g. the Chapter 1 heading) clears the selection and the toolbar with no highlight created. (4) Overlapping selection over an existing highlight creates a second, separate highlight (no merge, no dedupe). (5) Delete has no confirmation anywhere. On Account the URL becomes ?book=pride-and-prejudice&status=deleted and a status region shows "Highlight deleted.". (6) The reader's side panel opens on the Contents tab on every load, so the tab must be selected each time. Accessible names: reader side panel tabs "Contents", "Highlights" (name becomes "Highlights 1" with a count badge), "Bookmarks"; the Highlights tabpanel has region "On this page" with heading "On this page", list items with a "Yellow highlight:" label, the quote paragraph, link "Ch. 1 · p. 1" (href /read/pride-and-prejudice/chapter-1#highlight-<uuid>), buttons "Add note" and "Delete", and link "All highlights" (href /account/highlights?book=pride-and-prejudice). Account page /account/highlights: heading "Highlights", region "Your books", book link "Pride and Prejudice" with text "Jane Austen · N highlights · 0 notes · changed <time>"; book view /account/highlights?book=pride-and-prejudice has heading "Pride and Prejudice", link "All books", region "1. Chapter 1" (heading "1. Chapter 1"), items with "Yellow highlight:", a blockquote with the quote, link "Ch. 1 · p. 1", button "Delete this highlight", and a collapsed details control titled "Delete all highlights in this book" (not exercised). The Account pages also show a "Markdown export is part of Pro." panel with a "See Pro" link; do not follow it (billing).

## Test Scenarios

### 1. Highlights in the reader

**Seed:** `tests/agents/signed-in.seed.ts`

#### 1.1. Empty states before any highlight exists

**File:** `tests/highlights/empty-states.spec.ts`

**Steps:**
  1. Go to /account/highlights.
    - expect: Heading 'Highlights' is visible.
    - expect: Region 'Your books' shows the text 'No highlights yet. Select text while reading to highlight it.'
    - expect: No book links are listed.
  2. Go to /read/pride-and-prejudice/chapter-1 and click the 'Highlights' tab in the side panel.
    - expect: The tab's name is just 'Highlights' (no count badge).
    - expect: The panel says 'Select text on the page to highlight it or add a note.'
    - expect: Link 'All highlights' is visible and has href /account/highlights?book=pride-and-prejudice.
    - expect: No 'On this page' region is present.

#### 1.2. Selection toolbar appears on text selection and lists its buttons

**File:** `tests/highlights/selection-toolbar.spec.ts`

**Steps:**
  1. Go to /read/pride-and-prejudice/chapter-1. Before selecting anything, check for a button named 'Highlight'.
    - expect: No selection toolbar is shown; 'Highlight' button is absent.
  2. Select the first paragraph ('It is a truth universally acknowledged...') with a real mouse drag (or a DOM selection of the paragraph plus mouseup/pointerup on it).
    - expect: A toolbar appears above the selection with buttons: 'Highlight', 'Note', 'Ask about this', 'Explain', 'Translate', 'Read aloud from here'.
    - expect: Do NOT press any button but Highlight in this suite; the others are only asserted visible if at all.
  3. Click the 'Chapter 1' level-1 heading to dismiss.
    - expect: The toolbar disappears and the selection is cleared.
    - expect: Open the 'Highlights' tab: still the empty state, no highlight was created.

#### 1.3. Highlight a passage (default yellow, no colour choice)

**File:** `tests/highlights/create-highlight.spec.ts`

**Steps:**
  1. Go to /read/pride-and-prejudice/chapter-1 and select the first paragraph so the toolbar appears.
    - expect: Toolbar is visible.
  2. Click the 'Highlight' button (the only button pressed).
    - expect: The toolbar closes immediately; no colour swatches or popover are offered (record: a single default colour exists).
    - expect: The paragraph is painted with a yellow-brown background (CSS Custom Highlight 'hl-yellow'; not a DOM element, so verify via sidebar or a visual check).
    - expect: The save request succeeds (assert the response status per CONTRIBUTING).
  3. Click the 'Highlights' tab.
    - expect: The tab's accessible name is now 'Highlights 1'.
    - expect: Region 'On this page' lists one item with 'Yellow highlight:' label, the full quote 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.', link 'Ch. 1 · p. 1', buttons 'Add note' and 'Delete' (do not press 'Add note').

#### 1.4. Highlight shows in reader tab and on Account with quote, colour, chapter and link back

**File:** `tests/highlights/highlight-lists.spec.ts`

**Steps:**
  1. Create a highlight on the first paragraph of chapter 1 as in the previous scenario. Note the href of the 'Ch. 1 · p. 1' link in the Highlights tab (/read/pride-and-prejudice/chapter-1#highlight-<uuid>).
    - expect: Link href matches /read/pride-and-prejudice/chapter-1#highlight-.+/.
  2. Go to /account/highlights.
    - expect: Region 'Your books' lists a link 'Pride and Prejudice' (href /account/highlights?book=pride-and-prejudice).
    - expect: Its summary reads 'Jane Austen · 1 highlights · 0 notes · changed <date>' (note the unpolished '1 highlights' wording; assert loosely with a regex on '1 highlight') with a time element.
  3. Click the 'Pride and Prejudice' link.
    - expect: URL is /account/highlights?book=pride-and-prejudice; heading 'Pride and Prejudice' level 1 and text 'Jane Austen'; link 'All books' visible.
    - expect: Region '1. Chapter 1' (heading '1. Chapter 1') has one item: 'Yellow highlight:', a blockquote with the quote text, link 'Ch. 1 · p. 1' with the same href as in the reader, button 'Delete this highlight'.
  4. Click the 'Ch. 1 · p. 1' link.
    - expect: Browser lands on /read/pride-and-prejudice/chapter-1#highlight-<uuid>; the passage is still highlighted and the Highlights tab shows count 1.

#### 1.5. Multiple and overlapping highlights are kept as separate entries

**File:** `tests/highlights/multiple-highlights.spec.ts`

**Steps:**
  1. Highlight the first paragraph of chapter 1 (Highlight button).
    - expect: Highlights tab name becomes 'Highlights 1'.
  2. Select a second, different paragraph ('Mr. Bennet replied that he had not.') and click 'Highlight'.
    - expect: Tab name becomes 'Highlights 2'; 'On this page' lists two items in page order, both labelled 'Yellow highlight:'.
  3. Select only the first 40 characters of the first paragraph (inside the existing highlight) and click 'Highlight'.
    - expect: A third item appears with the quote 'It is a truth universally acknowledged,' (the overlap is not merged or rejected); tab name is 'Highlights 3'.
  4. Go to /account/highlights, open the book.
    - expect: Summary says 3 highlights; region '1. Chapter 1' lists three blockquotes.

#### 1.6. Highlights persist after reload and navigation

**File:** `tests/highlights/persistence.spec.ts`

**Steps:**
  1. Highlight the first paragraph of chapter 1, then reload the page.
    - expect: The passage is still painted yellow (verify with a screenshot of the paragraph or the side panel).
    - expect: Open 'Highlights' tab (the panel defaults to Contents after each load): name 'Highlights 1' and the item is listed.
  2. Click the 'Next page' link, then 'Page 1' in 'Pages in this chapter'.
    - expect: The highlight and the count of 1 are still present on page 1.

#### 1.7. Delete a highlight from the reader's Highlights tab

**File:** `tests/highlights/delete-from-reader.spec.ts`

**Steps:**
  1. Create a highlight on the first paragraph, open the 'Highlights' tab, and click 'Delete'.
    - expect: No confirmation dialog appears.
    - expect: The item disappears; the tab returns to name 'Highlights' and shows 'Select text on the page to highlight it or add a note.'
    - expect: The yellow paint is removed from the paragraph.
    - expect: The delete request succeeds.
  2. Go to /account/highlights.
    - expect: 'No highlights yet. Select text while reading to highlight it.' is shown; no book link.
  3. Reload the reader and open the Highlights tab.
    - expect: Still empty.

#### 1.8. Delete a highlight from Account highlights and confirm it is gone everywhere

**File:** `tests/highlights/delete-from-account.spec.ts`

**Steps:**
  1. Create two highlights in chapter 1 (first paragraph, and 'Mr. Bennet replied that he had not.').
    - expect: Highlights tab shows 2.
  2. Go to /account/highlights?book=pride-and-prejudice and click 'Delete this highlight' on the second item.
    - expect: URL becomes /account/highlights?book=pride-and-prejudice&status=deleted.
    - expect: A status region shows 'Highlight deleted.'.
    - expect: Only the first quote remains in region '1. Chapter 1'.
    - expect: No confirmation prompt.
  3. Go to /read/pride-and-prejudice/chapter-1 and open the Highlights tab.
    - expect: Name is 'Highlights 1'; only the first quote is listed; the second paragraph is not painted.
  4. Delete the remaining highlight from the Account book view, then go to /account/highlights.
    - expect: The book view shows no items (or the empty state); /account/highlights shows 'No highlights yet. Select text while reading to highlight it.'
    - expect: The reader's Highlights tab is empty again.

#### 1.9. Colour change is not supported (documented behaviour)

**File:** `tests/highlights/no-colour-change.spec.ts`

**Steps:**
  1. Highlight the first paragraph, then click the highlighted text with the mouse.
    - expect: Nothing opens: no popover, swatches or menu; the highlight remains yellow.
  2. Select part of the highlighted text so the toolbar appears.
    - expect: Toolbar shows the same six buttons; no colour options; there is no 'Remove highlight' variant. Do not press any button other than Highlight.
  3. Inspect the Highlights tab and the Account list.
    - expect: Items only offer 'Add note' and 'Delete' (reader) or 'Delete this highlight' (Account); no colour control.
  4. Finish by running the accessibility and horizontal overflow checks at this state (CONTRIBUTING).
    - expect: scanAccessibility() returns no violations (add narrow KNOWN_ISSUES if a real Folio bug appears); horizontalOverflow is 0 on desktop, phone and tablet.

#### 1.10. Highlights tab and toolbar on narrow screens

**File:** `tests/highlights/responsive.spec.ts`

**Steps:**
  1. On phone and tablet projects, open the reader at /read/pride-and-prejudice/chapter-1, open the contents panel through the page object (e.g. via the 'Open menu' button or panel control), choose 'Highlights'.
    - expect: The empty-state text is visible; the specs do not branch on project (the page object handles panel opening).
  2. Select the first paragraph and click 'Highlight'.
    - expect: The highlight is created and listed in the panel, same as on desktop. (Layout of the toolbar on small screens was not explored on desktop and needs checking when drafted.)
