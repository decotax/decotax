import "./main.css";
import { createApp } from "vue";
createApp(() => "[Component]").mount("#app");
(async () => { (await import("./moduletest.ts")).default(); })();
