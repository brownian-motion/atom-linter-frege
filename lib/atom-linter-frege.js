'use babel';

import AtomLinterFregeView from './atom-linter-frege-view';
import { CompositeDisposable } from 'atom';

export default {

  atomLinterFregeView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomLinterFregeView = new AtomLinterFregeView(state.atomLinterFregeViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomLinterFregeView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-linter-frege:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomLinterFregeView.destroy();
  },

  serialize() {
    return {
      atomLinterFregeViewState: this.atomLinterFregeView.serialize()
    };
  },

  toggle() {
    console.log('AtomLinterFrege was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
