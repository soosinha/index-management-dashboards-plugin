/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { Component, ChangeEvent } from "react";
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiButton,
  EuiFormRow,
  EuiFieldText,
  EuiHorizontalRule,
  euiDragDropReorder,
  DropResult,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiPortal,
} from "@elastic/eui";
import { UIAction, Policy, State, Action, UITransition } from "../../../../../models/interfaces";
import CreateTransition from "../CreateTransition";
import CreateAction from "../CreateAction";
import Actions from "./Actions";
import Transitions from "./Transitions";
import { getOrderInfo, getUIActionFromData } from "../../utils/helpers";
import { makeId } from "../../../../utils/helpers";

interface CreateStateProps {
  policy: Policy;
  onSaveState: (state: State, editingState: State | null, states: State[], order: string, afterBeforeState: string) => void;
  onCloseFlyout: () => void;
  state: State | null;
}

interface CreateStateState {
  name: string;
  createAction: boolean;
  editAction: UIAction<Action> | null;
  createTransition: boolean;
  editTransition: UITransition | null;
  actions: UIAction<Action>[];
  transitions: UITransition[];
  afterBeforeState: string;
  order: string;
  disableOrderSelections: boolean;
}

export default class CreateState extends Component<CreateStateProps, CreateStateState> {
  constructor(props: CreateStateProps) {
    super(props);

    const { afterBeforeState, order, disableOrderSelections } = getOrderInfo(props.state, props.policy.states);
    this.state = {
      name: props.state?.name || "",
      createAction: false,
      editAction: null,
      createTransition: false,
      editTransition: null,
      actions: props.state?.actions?.map((action) => getUIActionFromData(action)) || [],
      transitions: props.state?.transitions?.map((transition) => ({ id: makeId(), transition })) || [],
      afterBeforeState,
      order,
      disableOrderSelections,
    };
  }

  onChangeStateName = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.value;
    this.setState((state) => ({ name }));
  };

  onDragEndActions = ({ source, destination }: DropResult) => {
    if (source && destination) {
      const items = euiDragDropReorder(this.state.actions, source.index, destination.index);
      this.setState({ actions: items });
    }
  };

  onDragEndTransitions = ({ source, destination }: DropResult) => {
    if (source && destination) {
      const items = euiDragDropReorder(this.state.transitions, source.index, destination.index);
      this.setState({ transitions: items });
    }
  };

  onClickDeleteAction = (idx: number) => {
    const { actions } = this.state;
    this.setState({ actions: actions.slice(0, idx).concat(actions.slice(idx + 1)) });
  };

  onClickEditAction = (action: UIAction<Action>) => this.setState({ editAction: action });

  onClickAddAction = () => this.setState({ createAction: true });

  onClickDeleteTransition = (idx: number) => {
    const { transitions } = this.state;
    this.setState({ transitions: transitions.slice(0, idx).concat(transitions.slice(idx + 1)) });
  };

  onClickEditTransition = (transition: UITransition) => this.setState({ editTransition: transition });

  onClickAddTransition = () => {
    this.setState({
      createTransition: true,
    });
  };

  onClickSaveTransition = (transition: UITransition) => {
    const { editTransition, transitions } = this.state;
    let newTransitions = [...transitions, transition];
    if (!!editTransition) {
      const foundTransitionIdx = transitions.findIndex(({ id }) => {
        return transition.id === id;
      });

      if (foundTransitionIdx >= 0) {
        newTransitions = transitions
          .slice(0, foundTransitionIdx)
          .concat(transition)
          .concat(transitions.slice(foundTransitionIdx + 1));
      }
    }
    this.setState((state) => ({
      transitions: newTransitions,
      createTransition: false,
      editTransition: null,
    }));
  };

  onClickSaveAction = (action: UIAction<Action>) => {
    const { editAction, actions } = this.state;
    if (action?.action) {
      let newActions = [...actions, action];
      if (!!editAction) {
        const foundActionIdx = actions.findIndex(({ id }) => action.id === id);
        if (foundActionIdx >= 0) {
          newActions = actions
            .slice(0, foundActionIdx)
            .concat(action)
            .concat(actions.slice(foundActionIdx + 1));
        }
      }
      this.setState({
        actions: newActions,
        editAction: null,
        createAction: false,
      });
    }
  };

  onClickCancelAction = () => {
    this.setState({ createAction: false, editAction: null });
  };

  onClickSaveState = () => {
    const { order, afterBeforeState } = this.state;
    const { onSaveState, state, policy } = this.props;
    onSaveState(
      {
        name: this.state.name,
        actions: this.state.actions.map((action) => action.toAction()),
        transitions: this.state.transitions.map((transition) => transition.transition),
      },
      state,
      policy.states,
      order,
      afterBeforeState
    );
  };

  renderDefault = () => {
    const { policy, state } = this.props;
    const { actions, name, afterBeforeState, order, disableOrderSelections } = this.state;
    // If we are editing a state filter it out from the selectable options
    const stateOptions = policy.states.map((state) => ({ value: state.name, text: state.name })).filter((s) => s.value !== state?.name);
    return (
      <>
        <EuiText>
          <h5>State name</h5>
          <span /> {/* Dummy span to get rid of last child styling on h5 */}
        </EuiText>

        <EuiFormRow fullWidth isInvalid={false} error={null}>
          <EuiFieldText
            fullWidth
            isInvalid={false}
            placeholder="sample_hot_state"
            readOnly={false}
            value={name}
            onChange={this.onChangeStateName}
            data-test-subj="create-state-state-name"
          />
        </EuiFormRow>

        <EuiSpacer />

        <EuiText>
          <h5>Order</h5>
          <span /> {/* Dummy span to get rid of last child styling on h5 */}
        </EuiText>

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow>
              <EuiSelect
                disabled={disableOrderSelections}
                options={[
                  { value: "after", text: "Add after" },
                  { value: "before", text: "Add before" },
                ]}
                value={order}
                onChange={(e) => this.setState({ order: e.target.value })}
                aria-label="Retry failed policy from"
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow>
              <EuiSelect
                disabled={disableOrderSelections}
                options={stateOptions}
                value={afterBeforeState}
                onChange={(e) => this.setState({ afterBeforeState: e.target.value })}
                aria-label="Retry failed policy from"
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiHorizontalRule />

        <Actions
          actions={actions}
          onClickDeleteAction={this.onClickDeleteAction}
          onClickEditAction={this.onClickEditAction}
          onDragEndActions={this.onDragEndActions}
          onClickAddAction={this.onClickAddAction}
        />

        <EuiHorizontalRule />

        <Transitions
          transitions={this.state.transitions}
          onDragEndTransitions={this.onDragEndTransitions}
          onClickDeleteTransition={this.onClickDeleteTransition}
          onClickEditTransition={this.onClickEditTransition}
          onClickAddTransition={this.onClickAddTransition}
        />
      </>
    );
  };

  renderDefaultFooter = () => {
    const { onCloseFlyout, state } = this.props;
    const { name } = this.state;
    const isEditing = !!state;
    return (
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty iconType="cross" onClick={onCloseFlyout} flush="left">
            Close
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton fill disabled={!name.trim().length} onClick={this.onClickSaveState}>
            {isEditing ? "Update state" : "Save state"}
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  };

  render() {
    const { onCloseFlyout, policy, state } = this.props;
    const { name, createAction, editAction, createTransition, editTransition, actions } = this.state;
    const isEditing = !!state;

    let title = `${isEditing ? "Edit" : "Create"} state: ${name}`;
    if (createTransition || createAction || !!editTransition || !!editAction) title = `State: ${name}`;

    // Filter out the current editing state if we are editing
    const stateOptions = policy.states.map((s) => s.name);

    let flyoutContent;
    if (createAction || !!editAction)
      flyoutContent = () => (
        <CreateAction
          actions={actions}
          editAction={editAction}
          stateName={name}
          onClickCancelAction={this.onClickCancelAction}
          onClickSaveAction={this.onClickSaveAction}
        />
      );
    if (createTransition || editTransition)
      flyoutContent = () => (
        <CreateTransition
          stateOptions={stateOptions}
          editTransition={editTransition}
          onCloseCreateTransition={() => this.setState({ createTransition: false, editTransition: null })}
          onClickSaveTransition={this.onClickSaveTransition}
        />
      );
    if (!flyoutContent)
      flyoutContent = () => (
        <>
          <EuiFlyoutBody>{this.renderDefault()}</EuiFlyoutBody>
          <EuiFlyoutFooter>{this.renderDefaultFooter()}</EuiFlyoutFooter>
        </>
      );
    return (
      <EuiPortal>
        <EuiFlyout ownFocus onClose={onCloseFlyout} maxWidth={600} size="m" aria-labelledby="flyoutTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="m">
              <h2 id="flyoutTitle">{title}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          {flyoutContent()}
        </EuiFlyout>
      </EuiPortal>
    );
  }
}