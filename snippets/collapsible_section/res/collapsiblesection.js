/* Provides expand/collapse functionality for each section marked with the
 * collapsibleSection class.
 *
 * The section is assumed to have two child elements: One with the class
 * "heading", which will be always visible and contain the expand/collapse
 * trigger; and one with the class "contents", which represents all the contents
 * to be expanded/collapsed.
 *
 * The script wraps all the heading's contents in a <button> which will
 * act as the trigger. (The heading must therefore contain only phrasing
 * content, e.g. be a valid h3 element, and must additionally contain no
 * interactive content (e.g. links or buttons).)
 *
 * The actual expanding/collapsing is relegated to CSS. To this end, the
 * section will be given the class 'scripted' when the functionality has
 * been set up, and the class 'collapsed' when the contents are to be
 * hidden.
 *
 * The element that represents the contents should have an id attribute,
 * which will be used to mark up the button appropriately.
 */
(function () {

    /* Sets up a new collapsible section.
     * element: jQuery object of the section whose two children will
     *          be set up as trigger container and hidden/shown content,
     *          respectively.
     */
    var CollapsibleSection = function (element) {
        this.section = element;
        this.heading = element.querySelector('.heading');
        this.contents = element.querySelector('.contents');
        this.collapsed = false;
        this.trigger = null;
    };

    /* Set up the given section for expanding/collapsing. Section is
     * collapsed by default.
     */
    CollapsibleSection.prototype.init = function () {
        if (this.heading == null || this.contents == null) {
            return;
        }
        this.trigger = document.createElement('button');
        this.trigger.setAttribute('type', 'button');
        var contentsId = this.contents.getAttribute('id');
        if (contentsId.length > 0) {
            this.trigger.setAttribute('aria-controls', contentsId);
        }
        var thisObject = this;
        this.trigger.onclick = function() {
            thisObject.setCollapseState(!thisObject.collapsed);
        };

        while(this.heading.firstChild != null) {
            this.trigger.appendChild(this.heading.firstChild);
        }
        this.heading.appendChild(this.trigger);

        this.setCollapseState(true);
        this.section.className += ' scripted';
    };

    /* Switch the section's collapsed state as given.
     * doCollapse: if truthy, the section's contents will be set to
     *             a collapsed state. Otherwise, they will be
     *             expanded.
     */
    CollapsibleSection.prototype.setCollapseState = function (doCollapse) {
        if (doCollapse) {
            this.section.className += ' collapsed';
        } else {
            this.section.className =
                    this.section.className.replace(' collapsed', '');
        }
        this.trigger.setAttribute('aria-expanded', '' + !doCollapse);
        this.contents.setAttribute('aria-hidden', '' + !!doCollapse);
        this.collapsed = doCollapse;
    };

    var collapsibleSections = document.querySelectorAll('.collapsibleSection');
    for (var i = 0; i < collapsibleSections.length; i++) {
        var collapsibleSection = new CollapsibleSection(collapsibleSections[i]);
        collapsibleSection.init();
    }
})();
