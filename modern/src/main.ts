import "./styles.css";
import { mountApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");

if (root === null) {
  throw new Error("Modderhouse root element is missing.");
}

mountApp(root);
