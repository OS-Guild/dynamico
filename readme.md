<p align="center">
  <img width="150" src="https://user-images.githubusercontent.com/6004537/58460249-e6fb7600-8135-11e9-80c7-49fa170cbc2e.png" />
</p>

<h1 align="center">Dynamico</h1>

<div align="center">

A remote (web-like) code push work-flow for continuous delivery of specific features native or web.

[![Known Vulnerabilities](https://snyk.io/test/github/soluto/dynamico/badge.svg)](https://snyk.io/test/github/soluto/dynamico) [![Coverage Status](https://coveralls.io/repos/github/Soluto/dynamico/badge.svg?branch=master)](https://coveralls.io/github/Soluto/dynamico?branch=master) [![npm version](https://badge.fury.io/js/%40dynamico%2Fcore.svg)](https://badge.fury.io/js/%40dynamico%2Fcore)

[![React Next 19' talk](https://user-images.githubusercontent.com/6004537/60823639-a8cf8880-a1b0-11e9-9222-3d861d0186d9.png)](http://www.youtube.com/watch?v=skAvHVyfwmo)

</div>

## [Getting Started](./getting-started.md)
## [Tutorial](./tutorial.md)

## Why?
<!-- In the growing web of today, when frameworks are constantly changing and it seems hard to keep track of the new trends and -->

### Native & Web
- Client and server framework agnostic
    - Client core and server driver are plugable by design - choose your own frontend framework (or go vanilla) and your own server and components storage
 
- Blazing fast feature delivery
    - Continuous Delivery for features
    - Avoid publishing new app version for every feature
    - Allow [micro-frontend](https://micro-frontends.org/) workflow
    - Remove the hassle of knowing the internals of the host application
        
- Reduces bundle size
    - Faster app build time
    - Simpler app build proccess
    - Shorter stores app reviews (Mobile only :pray:) learn more [here](https://hackmd.io/-LtyFtvRShCCQlWb8wI4Dg?both#Native-stores-complience)

- De-**monolith**-ization 🤯
    - Team independent feature development, test & release
    - Seperates core main features from lazy-loaded dynamic flows
    - Eliminates pull-requests rebase push race
    - Reduces repository size and complexity 
    - Share components across multiple apps

- Specific feature version management
    - Caches locally and updates immidiatly
    - Smart host dependencies resolution


## When?
Dynamico allows a remote code push work-flow for continuous delivery of specific features.

### Native
- Whenever you're using a js based library to create a native app (e.g React Native, Electron, etc..)

### Web
- When you want to avoid a monolith
- When many developers work in a single repository and need to iterate fast

## Future thoughts
- Micro-frontends framework
- JSON based configuration that your PM can write and decide what components to show
- Config based feature rollout and A/B testing

## Roadmap
- Analytics

## Native stores complience

### Apple appstore
- This framework, when used properly, complies with section 3.3.2 of the [developer agreement](https://download.developer.apple.com/Documentation/License_Agreements__Apple_Developer_Program/Apple_Developer_Program_License_Agreement_20181019.pdf) and actually encourages safer patterns than the alternatives:
> Except as set forth in the next paragraph, an Application may not download or install executable code.  Interpreted code may be downloaded toan Application but only so long as such code: (a) does not change the primary purpose of the Application by providing features or functionality that are inconsistent with the intended and advertised purpose of the Application as submitted to the App Store, (b) does not create a store or storefront for other code or applications, and \(c\) does not bypass signing, sandbox, or other security features of the OS. 
