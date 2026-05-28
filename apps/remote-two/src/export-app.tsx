import { createBridgeComponent } from "@module-federation/bridge-react/v19";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

function RootApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default createBridgeComponent({ rootComponent: RootApp });
