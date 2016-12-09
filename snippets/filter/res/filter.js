/* Sets up given groups of form controls (checkboxes, radio buttons or select
 * options) so that they can be used to filter (show and hide elements in) an
 * associated list.
 *
 * Showing and hiding is done via the 'hidden' attribute, so it is necessary
 * to take care when manipulating the 'display' property in CSS.
 *
 * The currently-active filter can be considered as a list of key/value pairs
 * that the list items must match in order to be shown. If a particular value
 * is empty, however, any item is considered to match the corresponding key.
 * When there are multiple key/value pairs (with non-empty values) in the
 * filter, items must match all of them in order to be shown.
 *
 * The list must have an ID which must be given in the 'data-filter-target'
 * attribute of an element that wraps all the form control groups. This wrapper
 * element must have the class '_js-filter'.
 *
 * If the wrapper has the 'hidden' attribute set, it will be removed as part
 * of this script's setup. This makes it possible to hide the controls in cases
 * where the script doesn't run (e.g. JS has been disabled), which may be
 * desired if there is no backend fallback implementation of the functionality.
 *
 * If the wrapper has the 'data-filter-join' attribute and it is set to "or",
 * an item will be considered to match if it matches at least one "key".
 * Otherwise it must match all of them.
 *
 * Any given group of form controls defines the possible values for one "key"
 * of the filter. The values must be given in the 'data-filter' attribute of
 * each individual control. The name of the key must be given by the
 * 'data-filter-name' attribute of a common ancestor element.
 *
 * One particular filter value is special: "*" signifies a wildcard that
 * matches all possible values.
 *
 * The aforementioned common ancestor element may also have a
 * 'data-filter-default' attribute specifying which value is to be applied if
 * the URL doesn't specify otherwise (i.e. the key was not present in the URL
 * at page load and the relevant form control has not been changed since). If
 * the attribute is not present, the default will be "*".
 *
 * For checkboxes it is also possible to define a 'data-filter-off' attribute
 * to signify what value the filter should have when the checkbox is not
 * checked.
 *
 * Examples of form control groups:
 * a)
 * <fieldset data-filter-name="country">
 *   <input type="radio" name="country" data-filter="Norway">
 *   <input type="radio" name="country" data-filter="Sweden">
 * </fieldset>
 *
 * (Show Norwegian items if the first radio button is selected, Swedish items
 * if the second radio button is selected, and all items if neither is
 * selected)
 *
 * b)
 * <select data-filter-name="country">
 *   <option data-filter="Norway"></option>
 *   <option data-filter="Sweden"></option>
 * </select>
 *
 * (Same as a) but with a select dropdown instead of radio buttons)
 *
 * c)
 * <div data-filter-name="norway" data-filter-default="false">
 *   <input type="checkbox" data-filter="true" data-filter-off="false">
 * </div>
 * <div data-filter-name="sweden" data-filter-default="false">
 *   <input type="checkbox" data-filter="true" data-filter-off="false">
 * </div>
 *
 * (By default, show items whose tags include neither 'norway' nor 'sweden'; if
 * the first checkbox is checked and the other is not, show only items that are
 * tagged 'norway' and not 'sweden'; and so on)
 *
 * d)
 * <div data-filter-name="norway">
 *   <input type="checkbox" data-filter="true" data-filter-off="*">
 * </div>
 * <div data-filter-name="sweden">
 *   <input type="checkbox" data-filter="true" data-filter-off="*">
 * </div>
 *
 * (By default, show all items; if the first checkbox is checked, show only
 * items that are tagged 'norway' regardless of whether or not they have the
 * 'sweden tag; and so on)
 *
 * If there is only one group of form controls (i.e. only one key; e.g. a list
 * is being filtered by a single select dropdown), 'data-filter-name' can be
 * set on the same element that has the '_js-filter' class.
 *
 * The items that are to be shown/hidden from the associated list are assumed
 * to correspond to its element children. To be considered a match for a given
 * key/value pair (with non-empty value) in the filter, an item must have a
 * 'data-filter-<key>' attribute with the appropriate value. (Fill in the key's
 * actual name instead of the <key> placeholder.)
 *
 * Examples of lists:
 * a)
 * <ul id="list1">
 *   <li data-filter-country="Norway"></li>
 *   <li data-filter-country="Denmark"></li>
 * </ul>
 *
 * b)
 * <ul id="list2">
 *   <li data-filter-norway="true"></li>
 *   <li data-filter-sweden="true" data-filter-norway="true"></li>
 * </ul>
 *
 * This script uses the URI fragment (i.e. what follows the "#" character in
 * the URI) to keep track of the filter settings, allowing for history
 * navigation, bookmarking etc. on browsers where session history management is
 * supported.  Pages using this script will therefore be unable to use the
 * fragment for scrolling to identified elements.
 *
 * (It is, however, possible to have multiple filtered lists on the same page,
 * as long as there is no overlap of key names.)
 */
(function () {
    function updateFilterPartFromControls(filter, key, controls) {
        filter[key] = '';
        [].forEach.call(controls, function(control) {
            if (control.tagName === 'INPUT' && control.checked ||
                    control.tagName === 'OPTION' && control.selected) {
                filter[key] = control.getAttribute('data-filter');
            } else if (control.tagName === 'INPUT' && !control.checked &&
                    control.hasAttribute('data-filter-off')) {
                filter[key] = control.getAttribute('data-filter-off');
            }
        });
    }

    function updateFilterPartFromUrl(filter, key, defaultValue) {
        var filterInUrl = location.hash.match(/^#!(.+)/);
        /* Filter expression uses ; as a separator between segments.
         * Look for the filter name at the beginning of each such segment.
         */
        var pattern = '(?:^|;)' + key + '=([^;]+)';
        var filterValueMatch;
        var newFilterValue = defaultValue;
        if (filterInUrl) {
            filterValueMatch = filterInUrl[1].match(pattern);
            if (filterValueMatch) {
                newFilterValue = filterValueMatch[1];
            }
        }
        filter[key] = newFilterValue;
    }

    function updateControlsFromFilterPart(controls, filter, key) {
        var control;
        var propToUpdate;
        var shouldSelect;
        [].forEach.call(controls, function(control) {
            propToUpdate = (control.tagName === 'OPTION' ?
                    'selected' : 'checked');
            shouldSelect = control.getAttribute('data-filter') === filter[key];
            control[propToUpdate] = shouldSelect;
        });
    }

    function updateUrlFromFilterPart(filter, key) {
        var existingFilter = location.hash.match(/#!(.+)/);
        var newFragment = '#!';
        var regExp = new RegExp('(' + key + '=[^;]*)');
        var newFilterPart = key + '=' + filter[key];
        if (history.pushState) {
            if (existingFilter) {
                newFragment += existingFilter[1];
            }
            if (newFragment.match(regExp)) {
                newFragment = newFragment.replace(regExp, newFilterPart);
            } else {
                if (existingFilter) {
                    newFragment += ';';
                }
                newFragment += newFilterPart;
            }
            history.pushState(newFilterPart, document.title, newFragment);
        }
    }

    function updateListFromFilter(list, filter, joinType) {
        var children = list.childNodes;
        var items = [];
        var filterIsEmpty = true;
        [].forEach.call(children, function(child) {
            if (child.nodeType === child.ELEMENT_NODE) {
                items.push(child);
            }
        });
        items.forEach(function(item) {
            var key;
            var wantedValue;
            var itemValue;
            var shouldShow = (joinType !== 'or');
            for (key in filter) {
                wantedValue = filter[key];
                itemValue = item.getAttribute('data-filter-' + key);
                if (joinType === 'or') {
                    if (itemValue === wantedValue || wantedValue === '*') {
                        shouldShow = true;
                        break;
                    }
                } else {
                    if (itemValue !== wantedValue && wantedValue !== '*') {
                        shouldShow = false;
                        break;
                    }
                }
            }
            if (shouldShow) {
                item.removeAttribute('hidden');
            } else {
                item.setAttribute('hidden', 'hidden');
            }
        });
    }

    function setupFilter(filterContainer) {
        var listId = filterContainer.getAttribute('data-filter-target');
        var list = document.getElementById(listId);
        var joinType = filterContainer.getAttribute('data-filter-join') === 'or' ?
                'or' : 'and';
        var currentFilter = {};

        var filterParts = [];
        if (filterContainer.hasAttribute('data-filter-name')) {
            filterParts.push(filterContainer);
        } else {
            filterParts = filterContainer.querySelectorAll('[data-filter-name]');
        }
        [].forEach.call(filterParts, function(filterPart) {
            setupFilterPart(filterPart, currentFilter, joinType, list, listId,
                    filterContainer);
        });

        updateListFromFilter(list, currentFilter, joinType);
    }

    function setupFilterPart(filterPart, currentFilter, joinType, list, listId,
            filterContainer) {
        var filterName = filterPart.getAttribute('data-filter-name');
        var filterControls = filterPart.querySelectorAll('[data-filter]');
        var defaultValue = filterPart.hasAttribute('data-filter-default') ?
                filterPart.getAttribute('data-filter-default') : '*';
        currentFilter[filterName] = defaultValue;

        filterPart.addEventListener('change', function() {
            updateFilterPartFromControls(currentFilter, filterName, filterControls);
            updateUrlFromFilterPart(currentFilter, filterName);
            updateListFromFilter(list, currentFilter, joinType);
        });

        window.addEventListener('popstate', function() {
            updateFilterPartFromUrl(currentFilter, filterName, defaultValue);
            updateControlsFromFilterPart(filterControls, currentFilter, filterName);
            updateListFromFilter(list, currentFilter, joinType);
        });

        for (var j = 0; j < filterControls.length; j++) {
            filterControls[j].setAttribute('aria-controls', listId);
        }
        filterContainer.removeAttribute('hidden');

        updateFilterPartFromUrl(currentFilter, filterName, defaultValue);
        updateControlsFromFilterPart(filterControls, currentFilter, filterName);
    }

    var filterContainers = document.querySelectorAll('._js-filter');
    [].forEach.call(filterContainers, setupFilter);
})();
