declare module "jspdf" {
  export interface jsPDFOptions {
    unit?: string;
    format?: string | number[];
  }

  export class jsPDF {
    constructor(options?: jsPDFOptions);
    setFont(font: string, style?: string): void;
    setFontSize(size: number): void;
    text(text: string, x: number, y: number): void;
    save(filename: string): void;
    [key: string]: any;
  }
}