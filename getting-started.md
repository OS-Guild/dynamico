# Getting Started
## Architecture
![Architecture](https://user-images.githubusercontent.com/13674505/60023087-c32c4100-969d-11e9-9fd4-6c25107dc69b.png)

<div align="center">
  <table align="center">
    <tr>
      <th>Host App</th>
      <th>Registry</th>
      <th>Component</th>
    </tr>
    <tr>
      <td>
        <a href="https://codesandbox.io/s/dynamico-host-app-dht8g?fontsize=14">
          <img alt="Edit dynamico-host-app" src="https://codesandbox.io/static/img/play-codesandbox.svg" />
        </a>
      </td>
      <td>
        <a href="https://codesandbox.io/s/dynamico-example-server-d5m9b?fontsize=14">
          <img alt="Edit dynamico-example-server" src="https://codesandbox.io/static/img/play-codesandbox.svg" />
        </a>
      </td>
      <td>
        <a href="https://codesandbox.io/s/dynamic-component-j8o1g?fontsize=14">
          <img alt="Edit dynamico-component" src="https://codesandbox.io/static/img/play-codesandbox.svg" />
        </a>
      </td>
    </tr>
  </table>
</div>

In this diagram you can see the relation between the host app and a component. The component and the host app are developed in different repositories. The component's code is introduced into the app through the Registry (Dynamico server), which happens on runtime 🤯

[Get started with Dynamico server](./server/readme.md)

[Get started with Dynamico client](./client/readme.md)
