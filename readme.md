# Dynamico

## Why?

### Mobile & Web

- Client and server framework agnostic
- Blazing fast feature delivery
  - Continuous Delivery for features
  - Avoid publishing new app version for every feature
  - Allow micro-frontend workflow
- Reduces bundle size

  - Faster app build time
  - Simpler app build proccess
  - Shorter stores app reviews (Mobile only :pray:)

- De-**monolith**-ization 🤯

  - Team independent feature development, test & release
  - Seperates core main features from lazy-loaded dynamic flows
  - Eliminates pull-requests rebase push race
  - Reduces repository size and complexity

- Specific feature version management
  - Caches locally and updates immidiatly
  - Smart host version resolution

## When?

### Mobile

- Whenever you're using a js based library to create a mobile app (e.g React Native)

### Web

- When you want to avoid a monolith
- When many developers work in a single repository and need to iterate fast

## Future thoughts

- JSON based configuration that your PM can write and decide what components to show
- Config based feature rollout and A/B testing
