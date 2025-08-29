# 📘 Project Best Practices

## 1. Project Purpose
A full-stack skill-sharing platform. The frontend uses React with TailwindCSS and DaisyUI to deliver an interactive user experience, including real-time chat. The backend provides REST endpoints and websocket events for messaging, presence, and media sharing.

---

## 2. Project Structure
- frontend/
  - components/
    - Chat/ChatWindow.jsx — Chat UI, socket interactions, GIF/emoji/file features
  - lib/socket — Socket connection helper
  - src/api — Axios instance configuration for API calls
- backend/ — Server-side APIs, authentication, and socket handlers
- README.md — High-level documentation

Guidelines:
- Keep feature code scoped within feature folders (e.g., components/Chat).
- Put cross-cutting utilities (API clients, socket connectors) in dedicated folders.
- Co-locate styles with components if custom CSS is needed; prefer Tailwind utilities.

---

## 3. Test Strategy
Recommended stack:
- Unit/Component tests: Jest + React Testing Library
- Integration tests: React Testing Library with MSW for API/socket mocking

What to test:
- Rendering states: loading, error, empty, with messages
- Input behavior: typing, send on Enter, disabled when disconnected
- Socket events: connect/disconnect, typing indicators, new message receipt
- Media flow: file selection, validation, upload success/failure
- Search: open/close panel, results rendering, scroll-to-message behavior

Conventions:
- Organize tests next to components as <Component>.test.jsx or in __tests__/ folders
- Use descriptive test names and Arrange-Act-Assert
- Mock environment variables when needed

Coverage:
- Prioritize critical user paths and socket interactions

---

## 4. Code Style
- Components: Functional with hooks
- State: Descriptive names; group related UI flags; minimize prop drilling
- Effects: One concern per effect; clean up subscriptions and timers
- Async: Use try/catch with user-facing error messages
- Accessibility: aria-labels for icon buttons; Escape closes overlays; tab-focus preserved

Naming:
- Components: PascalCase (ChatWindow)
- Functions/handlers: camelCase (handleInputChange)
- State: camelCase (peerTyping, isConnected)
- Files: match component or domain (ChatWindow.jsx)

Comments:
- Explain socket event contracts and complex effects succinctly
- Remove dead code and stale comments

---

## 5. Common Patterns
- Socket lifecycle: connect on mount, join room, rejoin on reconnect, clean listeners on unmount
- Optimistic UI: create temp messages with clientId, replace on server confirm
- Overlay panels: anchored to header/toolbar with absolute positioning, z-index, outside-click close
- Media upload: multipart/form-data with size/type validation
- Search: server-side query, client-side scroll/highlight

---

## 6. Do's and Don'ts
- ✅ Do
  - Rejoin rooms on reconnect
  - Use stable keys for lists (_id, clientId)
  - Validate files client-side (size/type)
  - Provide accessible controls with aria-attributes
  - Debounce stop-typing events
  - Keep styles in Tailwind/DaisyUI utilities
  - Handle errors with actionable messages

- ❌ Don't
  - Nest unrelated UI (e.g., actions inside avatar container)
  - Depend on window reloads for error recovery
  - Expose private keys to the client (proxy if needed)
  - Forget to clean up socket listeners and timers
  - Use array index as key for dynamic message lists

---

## 7. Tools & Dependencies
- React — UI library
- TailwindCSS + DaisyUI — Styling and components
- Axios (frontend/src/api) — HTTP client
- Socket (frontend/lib/socket) — Real-time communication
- Emoji Picker — Emoji selection UI
- GIPHY API — GIF search (consider backend proxy)

Setup notes:
- Configure Tailwind + DaisyUI in tailwind.config.js
- Provide VITE_GIPHY_API_KEY in .env for GIFs; throttle and handle error states

---

## 8. Other Notes
- Message rendering: whitespace-preserving text, image previews, timestamp and temp state display
- Panels: Search, GIF, Emoji close on outside click/Escape; anchored to header/toolbar
- Connectivity: Show presence and typing indicators; disable inputs while disconnected
- Future improvements: message grouping by date, image lightbox, read receipts, drag-and-drop uploads, paste-to-upload, keyboard shortcuts (e.g., Ctrl/Cmd+K for search)
