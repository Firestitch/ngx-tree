import { Pipe, PipeTransform, inject } from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';


@Pipe({
  name: 'fsTreeHighlight',
  standalone: true,
})
export class FsTreeHighlightPipe implements PipeTransform {

  private _sanitizer = inject(DomSanitizer);

  public transform(value: string, query: string): SafeHtml | string {
    if (!query || !value) {
      return value || '';
    }

    const text = String(value);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const highlighted = text.replace(
      regex,
      '<mark style="background-color: yellow; padding: 0;">$1</mark>',
    );

    return this._sanitizer.bypassSecurityTrustHtml(highlighted);
  }
}
