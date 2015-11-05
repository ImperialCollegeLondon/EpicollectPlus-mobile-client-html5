/*jslint vars: true , nomen: true, devel: true, plusplus:true*/
/*global $, jQuery*/
/*
 * @module EC
 * @submodulemodule Parser
 */
var EC = EC || {};
EC.Parse = (function (module) {
    'use strict';

    var _mapGroupInputsPositions = function (the_input) {

        //var group_inputs = $(this).children();
        var group_inputs = the_input.children();
        var ref = the_input.attr('ref');
        var group_input = {
            input_ref: ref,
            positions: []
        };


        $(group_inputs).each(function (index, single_group_input) {

            group_input.positions.push({
                ref: $(single_group_input).attr('ref'),
                position: index + 1
            });

        });

        return group_input;

    };

    /**
     * Map the position a form input using the @ref attribute and return an array:
     * Doing this because when converting to json the same tags are grouped together and we lose the correct inputs order!
     */

    module.mapPositionToInput = function (the_xml) {

        var xml = the_xml;
        var form_children;
        var input_positions = [];
        var form_num;
        var form_position = 1;
        var position;
        var positions;
        var key;
        var main;
        var form_name;
        var hierarchy_skip_key;
        var branch_skip_keys = [];
        var group = {};


        $(xml).find('form').each(function (i) {
                form_children = $(this).children();
                positions = [];
                position = 1;

                //get form key value
                key = $(this).attr('key');

                //get form main value. true: main form, false: branch form
                main = $(this).attr('main');

                form_num = parseInt($(this).attr('num'), 10);

                //get form name which is unique within a project
                form_name = $(this).attr('name');

                //loop all the inputs
                $(form_children).each(function (index) {

                    group = [];

                    var ref = $(this).attr('ref');

                    if (form_num === 1) {

                        if (!hierarchy_skip_key) {
                            hierarchy_skip_key = key;
                            branch_skip_keys.push(key);
                        }

                        //if it is a group, the ref will have '_group' at the end
                        //we need to map the gruop inputs to keep the position when saving them as json: xml does not keep the order
                        if (ref.slice(-6) === '_group') {
                            group = _mapGroupInputsPositions($(this));
                        }

                        positions.push({

                            form_num: form_num,
                            form_name: form_name,
                            form_position: form_position,
                            position: position,
                            ref: ref,
                            group: group
                        });

                        position++;

                    }
                    else {

                        /* remove reference to parent key from child form: we have to skip the input where the @ref is equal to the @key of the immediate parent;
                         * that input is there on the xml for legacy reasons. It is used in the old Android client but no more on the new HTML5 implementation
                         */

                        if (ref === hierarchy_skip_key) {

                            positions.push({

                                form_num: form_num,
                                form_name: form_name,
                                form_position: form_position,
                                position: 'skip',
                                ref: ref,
                                group: group

                            });
                        } else {

                            //check if the current form is a branch, in that case skip the input if the ref is equal to any one of the cached main keys
                            //(again to skip the useless input there for legacy reasons)
                            if (main === 'false' && EC.Utils.inArray(branch_skip_keys, ref)) {

                                positions.push({

                                    form_num: form_num,
                                    form_name: form_name,
                                    form_position: form_position,
                                    position: 'skip',
                                    ref: ref,
                                    group: group
                                });

                            } else {

                                //if it is a group, the ref will have '_group' at the end
                                //we need to map the group inputs to keep the position when saving them as json: xml does not keep the order
                                if (ref.slice(-6) === '_group') {
                                    group = _mapGroupInputsPositions($(this));
                                }

                                positions.push({

                                    form_num: form_num,
                                    form_name: form_name,
                                    form_position: form_position,
                                    position: position,
                                    ref: ref,
                                    group: group
                                });
                            }
                            position++;
                        }
                    }
                });

                /*if the form is a main one and not a branch, cache its key
                 (as it is needed later to recognised a legacy input field to be removed)
                 as the branch forms are in random order (lol),
                 the hierarchy forms keys are cached in an array as we have to skip a branch input
                 if the ref is equal to any of them */
                if (main === 'true') {

                    hierarchy_skip_key = key;
                    branch_skip_keys.push(key);
                }

                input_positions.push(positions);
                form_num++;
                form_position++;

            }
        );


        console.log('input_positions');
        console.log(input_positions, true);

        return input_positions;
    };

    return module;

}(EC.Parse));
