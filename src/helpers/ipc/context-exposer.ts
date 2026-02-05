import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeJavtubeContext } from "./javtube-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeJavtubeContext();
}
