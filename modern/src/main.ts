import "./styles.css";
import "./responsive-hardening.css";
import "./maturity.css";
import { mountApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Modderhouse root element is missing.");
}

mountApp(root);
