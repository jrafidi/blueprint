/**
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { AbstractComponent, Hotkey, Hotkeys, HotkeysTarget, IHotkeysProps, IProps } from "@blueprintjs/core";
import * as classNames from "classnames";
import * as React from "react";
import { AutoSizer, MultiGrid } from "react-virtualized";

import { Column, IColumnProps } from "../column";
import { IFocusedCellCoordinates } from "../common/cell";
import * as Classes from "../common/classes";
import * as Errors from "../common/errors";
import { IColumnIndices, IRowIndices } from "../common/grid";
import { Rect } from "../common/rect";
import { RenderMode } from "../common/renderMode";
import { Utils } from "../common/utils";
import { IColumnWidths } from "../headers/columnHeader";
import { IRowHeaderRenderer, IRowHeights, renderDefaultRowHeader } from "../headers/rowHeader";
import { IContextMenuRenderer } from "../interactions/menus";
import { IIndexedResizeCallback } from "../interactions/resizable";
import { ISelectedRegionTransform } from "../interactions/selectable";
import { GuideLayer } from "../layers/guides";
import { IRegion, IStyledRegionGroup, RegionCardinality, SelectionModes, TableLoadingOption } from "../regions";

export interface ITableProps extends IProps, IRowHeights, IColumnWidths {
    /**
     * If `false`, only a single region of a single column/row/cell may be
     * selected at one time. Using `ctrl` or `meta` key will have no effect,
     * and a mouse drag will select the current column/row/cell only.
     * @default true
     */
    allowMultipleSelection?: boolean;

    /**
     * The children of a `Table` component, which must be React elements
     * that use `IColumnProps`.
     */
    children?: React.ReactElement<IColumnProps> | Array<React.ReactElement<IColumnProps>>;

    /**
     * A sparse number array with a length equal to the number of columns. Any
     * non-null value will be used to set the width of the column at the same
     * index. Note that if you want to update these values when the user
     * drag-resizes a column, you may define a callback for `onColumnWidthChanged`.
     */
    columnWidths?: Array<number | null | undefined>;

    /**
     * If `true`, there will be a single "focused" cell at all times,
     * which can be used to interact with the table as though it is a
     * spreadsheet. When false, no such cell will exist.
     * @default false
     */
    enableFocus?: boolean;

    /**
     * If `true`, empty space in the table container will be filled with empty
     * cells instead of a blank background.
     * @default false
     */
    fillBodyWithGhostCells?: boolean;

    /**
     * If defined, will set the focused cell state. This changes
     * the focused cell to controlled mode, meaning you are in charge of
     * setting the focus in response to events in the `onFocus` callback.
     */
    focusedCell?: IFocusedCellCoordinates;

    /**
     * If defined, this callback will be invoked for each cell when the user
     * attempts to copy a selection via `mod+c`. The returned data will be copied
     * to the clipboard and need not match the display value of the `<Cell>`.
     * The data will be invisibly added as `textContent` into the DOM before
     * copying. If not defined, keyboard copying via `mod+c` will be disabled.
     */
    getCellClipboardData?: (row: number, col: number) => any;

    /**
     * If `false`, disables reordering of columns.
     * @default false
     */
    isColumnReorderable?: boolean;

    /**
     * If `false`, disables resizing of columns.
     * @default true
     */
    isColumnResizable?: boolean;

    /**
     * If `false`, hides the row headers and settings menu.
     * @default true
     */
    isRowHeaderShown?: boolean;

    /**
     * If `false`, disables reordering of rows.
     * @default false
     */
    isRowReorderable?: boolean;

    /**
     * If `false`, disables resizing of rows.
     * @default false
     */
    isRowResizable?: boolean;

    /**
     * A list of `TableLoadingOption`. Set this prop to specify whether to
     * render the loading state for the column header, row header, and body
     * sections of the table.
     */
    loadingOptions?: TableLoadingOption[];

    /**
     * The number of columns to freeze to the left side of the table, counting
     * from the leftmost column.
     * @default 0
     */
    numFrozenColumns?: number;

    /**
     * The number of rows to freeze to the top of the table, counting from the
     * topmost row.
     * @default 0
     */
    numFrozenRows?: number;

    /**
     * The number of rows in the table.
     */
    numRows?: number;

    /**
     * If reordering is enabled, this callback will be invoked when the user finishes
     * drag-reordering one or more columns.
     */
    onColumnsReordered?: (oldIndex: number, newIndex: number, length: number) => void;

    /**
     * If resizing is enabled, this callback will be invoked when the user
     * finishes drag-resizing a column.
     */
    onColumnWidthChanged?: IIndexedResizeCallback;

    /**
     * An optional callback invoked when all cells in view have completely rendered.
     * Will be invoked on initial mount and whenever cells update (e.g., on scroll).
     */
    onCompleteRender?: () => void;

    /**
     * If you want to do something after the copy or if you want to notify the
     * user if a copy fails, you may provide this optional callback.
     *
     * Due to browser limitations, the copy can fail. This usually occurs if
     * the selection is too large, like 20,000+ cells. The copy will also fail
     * if the browser does not support the copy method (see
     * `Clipboard.isCopySupported`).
     */
    onCopy?: (success: boolean) => void;

    /**
     * A callback called when the focus is changed in the table.
     */
    onFocus?: (focusedCell: IFocusedCellCoordinates) => void;

    /**
     * If resizing is enabled, this callback will be invoked when the user
     * finishes drag-resizing a row.
     */
    onRowHeightChanged?: IIndexedResizeCallback;

    /**
     * If reordering is enabled, this callback will be invoked when the user finishes
     * drag-reordering one or more rows.
     */
    onRowsReordered?: (oldIndex: number, newIndex: number, length: number) => void;

    /**
     * A callback called when the selection is changed in the table.
     */
    onSelection?: (selectedRegions: IRegion[]) => void;

    /**
     * A callback called when the visible cell indices change in the table.
     */
    onVisibleCellsChange?: (rowIndices: IRowIndices, columnIndices: IColumnIndices) => void;

    /**
     * An optional callback for displaying a context menu when right-clicking
     * on the table body. The callback is supplied with an array of
     * `IRegion`s. If the mouse click was on a selection, the array will
     * contain all selected regions. Otherwise it will have one `IRegion` that
     * represents the clicked cell.
     */
    renderBodyContextMenu?: IContextMenuRenderer;

    /**
     * Dictates how cells should be rendered. Supported modes are:
     * - `RenderMode.BATCH`: renders cells in batches to improve performance
     * - `RenderMode.BATCH_ON_UPDATE`: renders cells synchronously on mount and
     *   in batches on update
     * - `RenderMode.NONE`: renders cells synchronously all at once
     * @default RenderMode.BATCH_ON_UPDATE
     */
    renderMode?: RenderMode;

    /**
     * Render each row's header cell.
     */
    renderRowHeader?: IRowHeaderRenderer;

    /**
     * A sparse number array with a length equal to the number of rows. Any
     * non-null value will be used to set the height of the row at the same
     * index. Note that if you want to update these values when the user
     * drag-resizes a row, you may define a callback for `onRowHeightChanged`.
     */
    rowHeights?: Array<number | null | undefined>;

    /**
     * If defined, will set the selected regions in the cells. If defined, this
     * changes table selection to controlled mode, meaning you in charge of
     * setting the selections in response to events in the `onSelection`
     * callback.
     *
     * Note that the `selectionModes` prop controls which types of events are
     * triggered to the `onSelection` callback, but does not restrict what
     * selection you can pass to the `selectedRegions` prop. Therefore you can,
     * for example, convert cell clicks into row selections.
     */
    selectedRegions?: IRegion[];

    /**
     * An optional transform function that will be applied to the located
     * `Region`.
     *
     * This allows you to, for example, convert cell `Region`s into row
     * `Region`s while maintaining the existing multi-select and meta-click
     * functionality.
     */
    selectedRegionTransform?: ISelectedRegionTransform;

    /**
     * A `SelectionModes` enum value indicating the selection mode. You may
     * equivalently provide an array of `RegionCardinality` enum values for
     * precise configuration.
     *
     * The `SelectionModes` enum values are:
     * - `ALL`
     * - `NONE`
     * - `COLUMNS_AND_CELLS`
     * - `COLUMNS_ONLY`
     * - `ROWS_AND_CELLS`
     * - `ROWS_ONLY`
     *
     * The `RegionCardinality` enum values are:
     * - `FULL_COLUMNS`
     * - `FULL_ROWS`
     * - `FULL_TABLE`
     * - `CELLS`
     *
     * @default SelectionModes.ALL
     */
    selectionModes?: RegionCardinality[];

    /**
     * Styled region groups are rendered as overlays above the table and are
     * marked with their own `className` for custom styling.
     */
    styledRegionGroups?: IStyledRegionGroup[];

    /**
     * If `true`, adds an interaction bar on top of all column header cells, and
     * moves interaction triggers into it.
     *
     * This value defaults to `undefined` so that, by default, it won't override
     * the `useInteractionBar` values that you might have provided directly to
     * each `<ColumnHeaderCell>`.
     *
     * @default undefined
     */
    useInteractionBar?: boolean;
}

export interface ITableState {
    /**
     * An array of column widths. These are initialized from the column props
     * and updated when the user drags column header resize handles.
     */
    columnWidths?: number[];

    /**
     * An array of pixel offsets for resize guides, which are drawn over the
     * table body when a row is being resized.
     */
    horizontalGuides?: number[];

    /**
     * If `true`, will disable updates that will cause re-renders of children
     * components. This is used, for example, to disable layout updates while
     * the user is dragging a resize handle.
     */
    isLayoutLocked?: boolean;

    /**
     * An array of row heights. These are initialized updated when the user
     * drags row header resize handles.
     */
    rowHeights?: number[];

    /**
     * An array of Regions representing the selections of the table.
     */
    selectedRegions?: IRegion[];

    /**
     * An array of pixel offsets for resize guides, which are drawn over the
     * table body when a column is being resized.
     */
    verticalGuides?: number[];

    /**
     * The `Rect` bounds of the viewport used to perform virtual viewport
     * performance enhancements.
     */
    viewportRect?: Rect;
}

@HotkeysTarget
export class Table extends AbstractComponent<ITableProps, ITableState> {
    public static defaultProps: ITableProps = {
        allowMultipleSelection: true,
        defaultColumnWidth: 150,
        defaultRowHeight: 20,
        enableFocus: false,
        fillBodyWithGhostCells: false,
        isRowHeaderShown: true,
        loadingOptions: [],
        minColumnWidth: 50,
        minRowHeight: 20,
        numFrozenColumns: 0,
        numFrozenRows: 0,
        numRows: 0,
        renderMode: RenderMode.BATCH_ON_UPDATE,
        renderRowHeader: renderDefaultRowHeader,
        selectionModes: SelectionModes.ALL,
    };

    private static createColumnIdIndex(children: Array<React.ReactElement<any>>) {
        const columnIdToIndex: { [key: string]: number } = {};
        for (let i = 0; i < children.length; i++) {
            const key = children[i].props.id;
            if (key != null) {
                columnIdToIndex[String(key)] = i;
            }
        }
        return columnIdToIndex;
    }

    private childrenArray: Array<React.ReactElement<IColumnProps>>;
    private columnIdToIndex: { [key: string]: number };

    public constructor(props: ITableProps, context?: any) {
        super(props, context);

        const { children, columnWidths, defaultRowHeight, defaultColumnWidth, numRows, rowHeights } = this.props;

        this.childrenArray = React.Children.toArray(children) as Array<React.ReactElement<IColumnProps>>;
        this.columnIdToIndex = Table.createColumnIdIndex(this.childrenArray);

        // Create height/width arrays using the lengths from props and
        // children, the default values from props, and finally any sparse
        // arrays passed into props.
        let newColumnWidths = this.childrenArray.map(() => defaultColumnWidth);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, columnWidths);
        let newRowHeights = Utils.times(numRows, () => defaultRowHeight);
        newRowHeights = Utils.assignSparseValues(newRowHeights, rowHeights);

        const selectedRegions = props.selectedRegions == null ? [] as IRegion[] : props.selectedRegions;

        this.state = {
            columnWidths: newColumnWidths,
            isLayoutLocked: false,
            rowHeights: newRowHeights,
            selectedRegions,
        };
    }

    // React lifecycle
    // ===============

    public componentWillReceiveProps(nextProps: ITableProps) {
        super.componentWillReceiveProps(nextProps);

        const { children, columnWidths, defaultColumnWidth, defaultRowHeight, numRows, rowHeights } = nextProps;

        const newChildArray = React.Children.toArray(children) as Array<React.ReactElement<IColumnProps>>;
        const numCols = newChildArray.length;

        // Try to maintain widths of columns by looking up the width of the
        // column that had the same `ID` prop. If none is found, use the
        // previous width at the same index.
        const previousColumnWidths = newChildArray.map((child: React.ReactElement<IColumnProps>, index: number) => {
            const mappedIndex = this.columnIdToIndex[child.props.id];
            return this.state.columnWidths[mappedIndex != null ? mappedIndex : index];
        });

        // Make sure the width/height arrays have the correct length, but keep
        // as many existing widths/heights when possible. Also, apply the
        // sparse width/heights from props.
        let newColumnWidths = this.state.columnWidths;
        newColumnWidths = Utils.arrayOfLength(newColumnWidths, numCols, defaultColumnWidth);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, previousColumnWidths);
        newColumnWidths = Utils.assignSparseValues(newColumnWidths, columnWidths);

        let newRowHeights = this.state.rowHeights;
        newRowHeights = Utils.arrayOfLength(newRowHeights, numRows, defaultRowHeight);
        newRowHeights = Utils.assignSparseValues(newRowHeights, rowHeights);

        this.childrenArray = newChildArray;
        this.columnIdToIndex = Table.createColumnIdIndex(this.childrenArray);
        this.setState({
            columnWidths: newColumnWidths,
            rowHeights: newRowHeights,
        });
    }

    public render() {
        const { className, numRows } = this.props;
        const { horizontalGuides, verticalGuides } = this.state;

        const classes = classNames(
            Classes.TABLE_CONTAINER,
            {
                [Classes.TABLE_NO_ROWS]: numRows === 0,
            },
            className,
        );

        return (
            <div className={classes}>
                <GuideLayer
                    className={Classes.TABLE_RESIZE_GUIDES}
                    verticalGuides={verticalGuides}
                    horizontalGuides={horizontalGuides}
                />
                <AutoSizer>
                    <MultiGrid />
                </AutoSizer>
            </div>
        );
    }

    public renderHotkeys(): React.ReactElement<IHotkeysProps> {
        const hotkeys = [
            this.maybeRenderCopyHotkey(),
            this.maybeRenderSelectAllHotkey(),
            this.maybeRenderFocusHotkeys(),
            this.maybeRenderSelectionResizeHotkeys(),
        ];
        return <Hotkeys>{hotkeys.filter(element => element !== undefined)}</Hotkeys>;
    }

    protected validateProps(props: ITableProps & { children: React.ReactNode }) {
        const { children, columnWidths, numFrozenColumns, numFrozenRows, numRows, rowHeights } = props;
        const numColumns = React.Children.count(children);

        // do cheap error-checking first.
        if (numRows != null && numRows < 0) {
            throw new Error(Errors.TABLE_NUM_ROWS_NEGATIVE);
        }
        if (numFrozenRows != null && numFrozenRows < 0) {
            throw new Error(Errors.TABLE_NUM_FROZEN_ROWS_NEGATIVE);
        }
        if (numFrozenColumns != null && numFrozenColumns < 0) {
            throw new Error(Errors.TABLE_NUM_FROZEN_COLUMNS_NEGATIVE);
        }
        if (numRows != null && rowHeights != null && rowHeights.length !== numRows) {
            throw new Error(Errors.TABLE_NUM_ROWS_ROW_HEIGHTS_MISMATCH);
        }
        if (numColumns != null && columnWidths != null && columnWidths.length !== numColumns) {
            throw new Error(Errors.TABLE_NUM_COLUMNS_COLUMN_WIDTHS_MISMATCH);
        }
        React.Children.forEach(children, (child: React.ReactElement<any>) => {
            // save as a variable so that union type narrowing works
            const childType = child.type;

            // the second part of this conditional will never be true, but it
            // informs the TS compiler that we won't be invoking
            // childType.prototype on a "string" element.
            if (typeof child === "string" || typeof childType === "string") {
                throw new Error(Errors.TABLE_NON_COLUMN_CHILDREN_WARNING);
            } else {
                const isColumn = childType.prototype === Column.prototype || Column.prototype.isPrototypeOf(childType);
                if (!isColumn) {
                    throw new Error(Errors.TABLE_NON_COLUMN_CHILDREN_WARNING);
                }
            }
        });

        // these are recoverable scenarios, so just print a warning.
        if (numFrozenRows != null && numRows != null && numFrozenRows > numRows) {
            console.warn(Errors.TABLE_NUM_FROZEN_ROWS_BOUND_WARNING);
        }
        if (numFrozenColumns != null && numFrozenColumns > numColumns) {
            console.warn(Errors.TABLE_NUM_FROZEN_COLUMNS_BOUND_WARNING);
        }
    }

    private getColumnProps(columnIndex: number) {
        const column = this.childrenArray[columnIndex] as React.ReactElement<IColumnProps>;
        return column.props;
    }

    // Hotkeys
    // =======

    private maybeRenderCopyHotkey() {
        const { getCellClipboardData } = this.props;
        if (getCellClipboardData != null) {
            return (
                <Hotkey
                    key="copy-hotkey"
                    label="Copy selected table cells"
                    group="Table"
                    combo="mod+c"
                    onKeyDown={this.handleCopy}
                />
            );
        } else {
            return undefined;
        }
    }

    private maybeRenderSelectionResizeHotkeys() {
        const { allowMultipleSelection, selectionModes } = this.props;
        const isSomeSelectionModeEnabled = selectionModes.length > 0;

        if (allowMultipleSelection && isSomeSelectionModeEnabled) {
            return [
                <Hotkey
                    key="resize-selection-up"
                    label="Resize selection upward"
                    group="Table"
                    combo="shift+up"
                    onKeyDown={this.handleSelectionResizeUp}
                />,
                <Hotkey
                    key="resize-selection-down"
                    label="Resize selection downward"
                    group="Table"
                    combo="shift+down"
                    onKeyDown={this.handleSelectionResizeDown}
                />,
                <Hotkey
                    key="resize-selection-left"
                    label="Resize selection leftward"
                    group="Table"
                    combo="shift+left"
                    onKeyDown={this.handleSelectionResizeLeft}
                />,
                <Hotkey
                    key="resize-selection-right"
                    label="Resize selection rightward"
                    group="Table"
                    combo="shift+right"
                    onKeyDown={this.handleSelectionResizeRight}
                />,
            ];
        } else {
            return undefined;
        }
    }

    private maybeRenderFocusHotkeys() {
        const { enableFocus } = this.props;
        if (enableFocus != null) {
            return [
                <Hotkey
                    key="move left"
                    label="Move focus cell left"
                    group="Table"
                    combo="left"
                    onKeyDown={this.handleFocusMoveLeft}
                />,
                <Hotkey
                    key="move right"
                    label="Move focus cell right"
                    group="Table"
                    combo="right"
                    onKeyDown={this.handleFocusMoveRight}
                />,
                <Hotkey
                    key="move up"
                    label="Move focus cell up"
                    group="Table"
                    combo="up"
                    onKeyDown={this.handleFocusMoveUp}
                />,
                <Hotkey
                    key="move down"
                    label="Move focus cell down"
                    group="Table"
                    combo="down"
                    onKeyDown={this.handleFocusMoveDown}
                />,
                <Hotkey
                    key="move tab"
                    label="Move focus cell tab"
                    group="Table"
                    combo="tab"
                    onKeyDown={this.handleFocusMoveRightInternal}
                    allowInInput={true}
                />,
                <Hotkey
                    key="move shift-tab"
                    label="Move focus cell shift tab"
                    group="Table"
                    combo="shift+tab"
                    onKeyDown={this.handleFocusMoveLeftInternal}
                    allowInInput={true}
                />,
                <Hotkey
                    key="move enter"
                    label="Move focus cell enter"
                    group="Table"
                    combo="enter"
                    onKeyDown={this.handleFocusMoveDownInternal}
                    allowInInput={true}
                />,
                <Hotkey
                    key="move shift-enter"
                    label="Move focus cell shift enter"
                    group="Table"
                    combo="shift+enter"
                    onKeyDown={this.handleFocusMoveUpInternal}
                    allowInInput={true}
                />,
            ];
        } else {
            return [];
        }
    }

    private maybeRenderSelectAllHotkey() {
        if (this.isSelectionModeEnabled(RegionCardinality.FULL_TABLE)) {
            return (
                <Hotkey
                    key="select-all-hotkey"
                    label="Select all"
                    group="Table"
                    combo="mod+a"
                    onKeyDown={this.handleSelectAllHotkey}
                />
            );
        } else {
            return undefined;
        }
    }
}
