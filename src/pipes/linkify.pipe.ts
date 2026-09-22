import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

marked.use({ gfm: true, breaks: true } as any);

const MD_PATTERN = /^#{1,6}\s|^\s*[-*+]\s|\*\*.+\*\*|\*.+\*|`[^`]+`|\[.+\]\(.+\)|^>\s/m;

@Pipe({ name: 'linkify', standalone: true })
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string): SafeHtml {
    if (!text) return '';
    let html: string;
    if (MD_PATTERN.test(text)) {
      html = marked.parse(text) as string;
    } else {
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      html = escaped.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
    }
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
