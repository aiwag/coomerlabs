import { exposeThemeContext } from "./theme/theme-context";
import { exposeWindowContext } from "./window/window-context";
import { exposeJavtubeContext } from "./javtube-context";
import { exposeArchivebateContext } from "./archivebate-context";

export default function exposeContexts() {
  exposeWindowContext();
  exposeThemeContext();
  exposeJavtubeContext();
  exposeArchivebateContext();
}
