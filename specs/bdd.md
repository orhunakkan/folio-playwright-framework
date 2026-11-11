# BDD scenarios: labels confirmed on dev

## Application Overview

Labels, roles and texts confirmed by exploring https://dev.agenticlibrary.app as a fresh signed-in test user (seed tests/agents/signed-in.seed.ts, project agents), then signed out. Third-party features were not pressed.

## Test Scenarios

### 1. BDD labels

**Seed:** `tests/agents/signed-in.seed.ts`

#### 1.1. Home Questions section

**File:** `specs/drafts/bdd/home-questions.spec.ts`

**Steps:**
  1. Open /. Find the region/heading 'Questions' (h2). Each question is a group whose summary is a generic named by the question text.
    - expect: Seven questions: 'Do I need an account to read?', 'Is there a free trial?', 'How does paying work?', 'What happens if I stop paying?', 'What does Ask the book cost?', 'Are my own books private?', 'Which voices does Read aloud use?'
  2. Click the summary 'Do I need an account to read?'
    - expect: A paragraph shows: No. The whole library and read aloud are open to everyone. An account adds highlights, notes, your own books and Ask the book; the Sign in page says how to get one.
  3. Click the summary 'Are my own books private?'
    - expect: A paragraph shows: Yes. Only you can open them. They never appear in the library, in search or in share links, and deleting one removes it at once.

#### 1.2. Library filters and book link

**File:** `specs/drafts/bdd/library-filter.spec.ts`

**Steps:**
  1. Open /library and wait for 'Showing 1 book'. In group 'Filter books' note buttons 'All' (pressed) and 'Classic novels'.
    - expect: 'All' has pressed state; 'Classic novels' does not
  2. Click 'Classic novels'
    - expect: URL /library?filter=novels; 'Classic novels' pressed, 'All' not; region 'Jane Austen' with a list; listitem holds a link (href /library/jane-austen/pride-and-prejudice) containing paragraphs 'Pride and Prejudice' and 'Jane Austen'

#### 1.3. Book page, offline download

**File:** `specs/drafts/bdd/book-offline.spec.ts`

**Steps:**
  1. Open /library/jane-austen/pride-and-prejudice
    - expect: Region 'Pride and Prejudice' with h1; link 'Start reading' (href /read/pride-and-prejudice/chapter-1); buttons 'Read aloud', 'Add to shelf', 'Download for offline'
  2. Click 'Download for offline', wait for 'Remove download', click it
    - expect: No confirmation dialog; 'Download for offline' returns

#### 1.4. Reader navigation and contents

**File:** `specs/drafts/bdd/reader-nav.spec.ts`

**Steps:**
  1. Open /read/pride-and-prejudice/chapter-1
    - expect: Disabled button 'Start of book' (previous) and button 'Next page'; text 'Chapter 1 · Page 1 of 2' inside navigation 'Page navigation'; links 'Page 1' and 'Page 2'
  2. Click 'Next page'
    - expect: URL /read/pride-and-prejudice/chapter-1/2; 'Chapter 1 · Page 2 of 2'; buttons 'Previous page' and 'Chapter 2' (next control becomes the next chapter)
  3. Click 'Previous page'
    - expect: URL /read/pride-and-prejudice/chapter-1; 'Page 1 of 2'
  4. In complementary 'Book contents panel', tab 'Contents' (selected), click link '02 Chapter 2'
    - expect: URL /read/pride-and-prejudice/chapter-2; h1 'Chapter 2'

#### 1.5. Sign out and sign in errors

**File:** `specs/drafts/bdd/auth.spec.ts`

**Steps:**
  1. Open the Account menu (details summary 'Account menu, signed in as <user>') and click button 'Sign out'
    - expect: Lands on /library; sidebar shows link 'Sign in' (/login)
  2. At /login fill Username and Password (labels) with e2e-000000000000 / wrong-password-123 and press 'Sign in'
    - expect: URL /login?error=invalid; role alert 'Username or password is incorrect.'; h1 'Sign in'; both fields invalid
  3. Signed out, open /account/highlights
    - expect: Redirect to /login?next=%2Faccount%2Fhighlights
