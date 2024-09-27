import $ from 'jquery';
import BaseView from 'oroui/js/app/views/base/view';
import ConversationModel from '../models/conversation-model';
import ConversationListView from '../conversation/list/conversation-list-view';
import ConversationMessagesView from '../conversation/messages/conversation-messages-view';
import ConversationHeaderView from './conversation-header-view';
import LoadingMaskView from 'oroui/js/app/views/loading-mask-view';
import template from 'tpl-loader!oroconversation/templates/conversation-view.html';

const ConversationView = BaseView.extend({
    autoRender: true,

    template,

    listen: {
        'change:id model': 'onActiveConversation',
        'change:hasConversations model': 'render',
        'layout:reposition mediator': 'onLayoutChange',
        'viewport:tablet-small mediator': 'onViewportChange'
    },

    constructor: function ConversationView(...args) {
        ConversationView.__super__.constructor.apply(this, args);
    },

    initialize(options) {
        const {title} = options;

        this.model = new ConversationModel({
            title
        });

        this.subview('conversationHeader', new ConversationHeaderView({
            model: this.model,
            title: this.title
        }));

        this.subview('conversationList', new ConversationListView({
            model: this.model
        }));

        this.subview('conversationMain', new ConversationMessagesView({
            model: this.model
        }));

        this.subview('loadingMask', new LoadingMaskView());
        this.listenToOnce(this.model, 'synced', () => {
            this.subview('loadingMask').dispose();
            this.removeSubview('loadingMask');
        });

        ConversationView.__super__.initialize.call(this, options);
    },

    delegateEvents(events) {
        ConversationMessagesView.__super__.delegateEvents.call(this, events);

        $(document).on(`visibilitychange${this.eventNamespace()}`, () => {
            if (document.hidden) {
                this.model.stopSync();
            } else {
                this.model.startSync();
            }
        });
    },

    undelegateEvents() {
        $(document).off(this.eventNamespace());
        return ConversationMessagesView.__super__.undelegateEvents.call(this);
    },

    render() {
        ConversationView.__super__.render.call(this);

        if (this.subview('loadingMask')) {
            this.subview('loadingMask').$el.appendTo(this.$('[data-role="conversation-content"]'));
            this.subview('loadingMask').show();
        }

        this.subview('conversationHeader').render().$el.prependTo(this.$el);
        this.subview('conversationList').render().$el.appendTo(this.$('[data-role="conversation-sidebar"]'));
        this.subview('conversationMain').render().$el.appendTo(this.$('[data-role="conversation-content"]'));

        this.onLayoutChange();
        return this;
    },

    onActiveConversation(model, value) {
        this.$el.toggleClass('conversation--has-selected-conversation', value);
    },

    onLayoutChange() {
        if (this.$('[data-role="conversation-content"]').length) {
            const {top} = this.$('[data-role="conversation-content"]').get(0).getBoundingClientRect();
            this.$el.css('--conversation-content-top-offset', `${top}px`);
        }
    },

    onViewportChange() {
        if (!this.model.get('id')) {
            this.subview('conversationList').selectFirst();
        } else {
            this.onActiveConversation(this.model.get('id'));
        }
    }
});

export default ConversationView;