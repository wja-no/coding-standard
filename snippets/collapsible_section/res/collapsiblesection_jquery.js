/* Provides expand/collapse functionality for each section marked with the
 * collapsibleSection class.
 *
 * The section is assumed to have two child elements: One with the class
 * "heading", which will be always visible and contain the expand/collapse
 * trigger; and one with the class "content", which represents all the contents
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
(function ($) {

    /* Sets up a new collapsible section.
     * element: jQuery object of the section whose two children will
     *          be set up as trigger container and hidden/shown content,
     *          respectively.
     */
    var CollapsibleSection = function (element) {
        this.section = element;
        this.heading = element.find('.heading').first();
        this.contents = element.find('.contents');
        this.collapsed = false;
        this.trigger = null;
    };

    /* Set up the given section for expanding/collapsing. Section is
     * collapsed by default.
     */
    CollapsibleSection.prototype.init = function () {
        var trigger = document.createElement('button');
        trigger.type = 'button';
        var contentsId = this.contents.attr('id');
        if (typeof contentsId === 'string' && contentsId.length > 0) {
            trigger.setAttribute('aria-controls', contentsId);
        }
        this.heading.wrapInner(trigger);
        /* jQuery seems to make a new copy of the button; when keeping a
         * reference to the original DOM object, modifications to it
         * don't seem to be reflected in the document.
         */
        this.trigger = this.heading.children('button');
        /* jQuery doesn't seem to keep the click handler either, so
         * adding it after wrapping...
         */
        var thisObject = this;
        this.trigger.on('click', function () {
            thisObject.setCollapseState(!thisObject.collapsed);
        });

        this.setCollapseState(true);
        this.section.addClass('scripted');
    };

    /* Switch the section's collapsed state as given.
     * doCollapse: if truthy, the section's contents will be set to
     *             a collapsed state. Otherwise, they will be
     *             expanded.
     */
    CollapsibleSection.prototype.setCollapseState = function (doCollapse) {
        if (doCollapse) {
            this.section.addClass('collapsed');
        } else {
            this.section.removeClass('collapsed');
        }
        this.trigger.attr('aria-expanded', '' + !doCollapse);
        this.contents.attr('aria-hidden', '' + !!doCollapse);
        this.collapsed = doCollapse;
    };

    $('.collapsibleSection').each(function () {
        var collapsibleSection = new CollapsibleSection($(this));
        collapsibleSection.init();
    });
})(jQuery);
