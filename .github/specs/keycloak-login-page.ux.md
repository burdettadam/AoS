# UX Spec: Keycloak Login Page

## Layout & Structure
- Centered login form
- Banner with application name: BOTCT
- Heading: "Sign in to your account"
- Form fields: Username or email, Password
- Actions: Forgot Password link, Remember me checkbox, Sign In button
- Registration prompt: "New user? Register"

## Elements
- Heading (level 1): clear, accessible
- Username/email textbox
- Password textbox with show/hide toggle
- Forgot Password link
- Remember me checkbox
- Sign In button (primary action)
- Register link for new users

## Interactions
- User enters credentials and clicks Sign In to authenticate
- "Forgot Password" opens password reset flow
- "Register" opens registration form
- Password field has show/hide toggle
- Remember me persists session

## Accessibility
- Semantic HTML: headings, form fields, buttons, links
- All form controls are keyboard accessible
- Labels and placeholders are clear
- Focus management: tab order is logical

## Theme & Background
- Custom BOTCT theme applied
- Dark background with geometric or image-based styling
- Consistent branding (logo, colors)

## Error Handling
- Invalid credentials prompt error message
- Password reset and registration flows are accessible
