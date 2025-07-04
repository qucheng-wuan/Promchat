declare module 'diff2html' {
  export interface Diff2HtmlConfig {
    drawFileList?: boolean;
    matching?: 'lines' | 'words' | 'none';
    outputFormat?: 'side-by-side' | 'line-by-line';
    renderNothingWhenEmpty?: boolean;
    matchingMaxComparisons?: number;
    maxLineLengthHighlight?: number;
    diffStyle?: 'word' | 'char';
  }

  export function html(diffInput: string, config?: Diff2HtmlConfig): string;
  export function parse(diffInput: string): any;
} 