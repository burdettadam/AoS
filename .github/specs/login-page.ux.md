# UX Spec: Login Page (`http://localhost:5173/login`)

## Layout & Structure
- Centered authentication prompt
- Heading: "Authentication Required"
- Supporting text: "You need to log in to access BotC Digital."
- Primary action: "Login with Keycloak" button

## Elements
- Heading (level 2): clear, accessible
- Paragraph: concise instructions
- Button: prominent, labeled for SSO

## Interactions
- Clicking "Login with Keycloak" triggers Keycloak authentication flow
- Page waits for authentication initialization before showing login options

## Accessibility
- Semantic HTML: heading, paragraph, button
- Button is keyboard accessible and clearly labeled
- Focus management: button is reachable via tab

## Theme & Background
- Minimal, dark-themed background
- No distracting elements; focus is on authentication
- Custom background and theme applied after SSO redirect (Keycloak)

## Error Handling
- If authentication fails, user is prompted to retry or contact support
