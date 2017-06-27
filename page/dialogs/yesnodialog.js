/**
 * Created by Mick on 27.06.2017.
 */

'use strict';
var BaseDialog = require('./../../public/javascripts/dialogs/basedialog');
var messageFlasher = require('./../messageflasher');

const EVT_POSITIVE = "positive";
const EVT_NEGATIVE = "negative";

class YesNoDialog extends BaseDialog {

    constructor(layoutLocals) {
        layoutLocals = layoutLocals || {};
        layoutLocals.I18N = I18N.completeLanguageData;

        layoutLocals.title = layoutLocals.title || title;
        layoutLocals.message = layoutLocals.message || message;

        layoutLocals.positive = layoutLocals.positive || "";
        layoutLocals.negative = layoutLocals.negative || "";

        layoutLocals.messages = layoutLocals.messages || [];
        layoutLocals.errors = layoutLocals.errors || [];

        layoutLocals.links = layoutLocals.links || [];

        super("yesNoDialog", layoutLocals);

        this.messagesContainer = this.fragment.querySelectorAll(".flash-messages")[0];

        messageFlasher(this.messagesContainer,layoutLocals.messages,layoutLocals.errors,true);
    }

    /**
     * @Override
     * @param action
     * @private
     */
    _click(action) {
        super._click(action);

        switch (action) {
            case "positive":
                this.emit(EVT_POSITIVE);
                this.close();
                break;
            case "negative":
                this.emit(EVT_NEGATIVE);
                this.close();
                break;
            default:
                return;
        }
    }
}

module.exports = YesNoDialog;