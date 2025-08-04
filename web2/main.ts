import "./main.css";
import { createApp } from "vue";
createApp(() => "[Component]").mount("#app");
(await import("./moduletest.ts")).default();
