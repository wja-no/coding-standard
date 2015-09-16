/* Sets up given groups of form controls (checkboxes, radio buttons or select
 * options) so that they can be used to filter (show and hide elements in) an
 * associated list.
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
 * Any given group of form controls defines the possible values for one "key"
 * of the filter. The values must be given in the 'data-filter' attribute of
 * each individual control. The name of the key must be given by the
 * 'data-filter-name' attribute of a common ancestor element.
 *
 * Examples of form control groups:
 * a)
 * <fieldset data-filter-name="country">
 *   <input type="radio" name="country" data-filter="Norway">
 *   <input type="radio" name="country" data-filter="Sweden">
 * </fieldset>
 *
 * b)
 * <select data-filter-name="country">
 *   <option data-filter="Norway"></option>
 *   <option data-filter="Sweden"></option>
 * </select>
 *
 * c)
 * <div data-filter-name="norway">
 *   <input type="checkbox" data-filter="true">
 * </div>
 * <div data-filter-name="sweden">
 *   <input type="checkbox" data-filter="true">
 * </div>
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
    function updateFilterPartFromControls (filter, key, $controls) {
        filter[key] = '';
        $controls.each(function () {
            var $control = $(this);
            if ($control.prop('checked') || $control.prop('selected')) {
                // Using attr instead of data since filter values are strings
                filter[key] = $control.attr('data-filter');
            }
        });
    }

    function updateFilterPartFromUrl (filter, key) {
        var filterInUrl = location.hash.match(/^#!(.+)/);
        /* Filter expression uses ; as a separator between segments.
         * Look for the filter name at the beginning of each such segment.
         */
        var pattern = '(?:^|;)' + key + '=([^;]+)';
        var filterValueMatch;
        var newFilterValue = '';
        if (filterInUrl) {
            filterValueMatch = filterInUrl[1].match(pattern);
            if (filterValueMatch) {
                newFilterValue = filterValueMatch[1];
            }
        }
        filter[key] = newFilterValue;
    }

    function updateControlsFromFilterPart ($controls, filter, key) {
        $controls.each(function () {
            var $control = $(this);
            var propToUpdate = ($control.prop('tagName') === 'OPTION' ?
                    'selected' : 'checked');
            // Using attr instead of data since filter values are strings
            var shouldSelect = $control.attr('data-filter') === filter[key];
            $control.prop(propToUpdate, shouldSelect);
        });
    }

    function updateUrlFromFilterPart (filter, key) {
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

    function updateListFromFilter ($list, filter) {
        var filterIsEmpty = true;
        var key;
        var $items = $list.children();
        $items.show();
        $items.each(function () {
            var $item = $(this);
            var i;
            var wantedValue;
            var itemValue;
            for (key in filter) {
                wantedValue = filter[key];
                // Using attr instead of data since filter values are strings
                itemValue = $item.attr('data-filter-' + key);
                if (wantedValue.length > 0 && itemValue !== wantedValue) {
                    $item.hide();
                    break;
                }
            }
        });
    }

    $('._js-filter').each(function () {
        var $filterContainer = $(this);
        var listId = $filterContainer.data('filter-target');
        var $list = $('#' + listId);
        var currentFilter = {};

        $filterContainer.find('[data-filter-name]').addBack('[data-filter-name]').each(function () {
            var $filterPart = $(this);
            var filterName = $filterPart.data('filter-name');
            var $filterControls = $('[data-filter]', $filterPart);
            currentFilter[filterName] = '';

            $filterPart.on('change', function () {
                updateFilterPartFromControls(currentFilter, filterName, $filterControls);
                updateUrlFromFilterPart(currentFilter, filterName);
                updateListFromFilter($list, currentFilter);
            });

            $(window).on('popstate', function () {
                updateFilterPartFromUrl(currentFilter, filterName);
                updateControlsFromFilterPart($filterControls, currentFilter, filterName);
                updateListFromFilter($list, currentFilter);
            });

            $filterControls.attr('aria-controls', listId);
            $list.attr('aria-live', 'polite');
            $filterContainer.removeAttr('hidden');

            updateFilterPartFromUrl(currentFilter, filterName);
            updateControlsFromFilterPart($filterControls, currentFilter, filterName);
        });

        updateListFromFilter($list, currentFilter);
    });
})();
