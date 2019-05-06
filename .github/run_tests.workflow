workflow "Run Tests" {
  on = "push"
  resolves = ["Run tests"]
}

action "Install Lerna" {
  uses = "nuxt/actions-yarn@master"
  runs = "yarn"
  args = "install"
}

action "Install dependencies" {
  uses = "nuxt/actions-yarn@master"
  runs = "yarn"
  args = "lerna bootstrap"
  needs = ["Install Lerna"]
}

action "Build" {
  uses = "nuxt/actions-yarn@master"
  runs = "yarn"
  args = "lerna run build"
  needs = ["Install dependencies"]
}

action "Link dependencies" {
  uses = "nuxt/actions-yarn@master"
  needs = ["Build"]
  runs = "yarn"
  args = "lerna link"
}

action "Run tests" {
  uses = "nuxt/actions-yarn@master"
  needs = ["Link dependencies"]
  runs = "yarn"
  args = "lerna run tests"
}
