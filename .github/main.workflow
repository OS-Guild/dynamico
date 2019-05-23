workflow "Run Tests" {
  on = "push"
  resolves = ["Generate coverage and upload to coveralls"]
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

action "Generate coverage and upload to coveralls" {
  uses = "nuxt/actions-yarn@master"
  needs = ["Link dependencies"]
  runs = "yarn"
  args = "coverage"
  secrets = ["COVERALLS_REPO_TOKEN"]
}
