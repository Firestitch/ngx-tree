import { AfterViewChecked, Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';


@Directive({
  selector: '[fsTreeSearchHighlight]',
  standalone: true,
})
export class FsTreeSearchHighlightDirective implements OnChanges, AfterViewChecked {

  @Input('fsTreeSearchHighlight')
  public searchQuery = '';

  private _el = inject(ElementRef);
  private _needsUpdate = false;

  public ngOnChanges(): void {
    this._needsUpdate = true;
  }

  public ngAfterViewChecked(): void {
    if (this._needsUpdate) {
      this._needsUpdate = false;
      this._removeHighlights();
      if (this.searchQuery) {
        this._applyHighlights();
      }
    }
  }

  private _removeHighlights(): void {
    const marks: NodeListOf<HTMLElement> = this._el.nativeElement
      .querySelectorAll('mark.fs-tree-search-highlight');

    marks.forEach((mark) => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }

      parent.removeChild(mark);
      parent.normalize();
    });
  }

  private _applyHighlights(): void {
    const escaped = this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      this._el.nativeElement,
      NodeFilter.SHOW_TEXT,
    );

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent;
      if (!regex.test(text)) {
        regex.lastIndex = 0;

        return;
      }

      regex.lastIndex = 0;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match: RegExpExecArray;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const mark = document.createElement('mark');
        mark.className = 'fs-tree-search-highlight';
        mark.style.backgroundColor = 'yellow';
        mark.style.padding = '0';
        mark.textContent = match[1];
        fragment.appendChild(mark);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(fragment, textNode);
    });
  }
}
