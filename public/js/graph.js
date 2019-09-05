const apiData = [
  {
    id: 'rootNode',
    value: 'Root',
    children: [
      {
        id: 'v1',
        value: 'v1',
        children: [
          {
            id: '12',
            value: '12-Double click to set name',
            children: [{ id: '14', value: '14-Double click to set name' }]
          }
        ]
      },
      {
        id: 'v2',
        value: 'v2',
        children: [
          {
            id: '16',
            value: '16-Double click to set name',
            children: [
              {
                id: '20',
                value: '20-Double click to set name',
                children: [
                  { id: '24', value: '24-Double click to set name' },
                  { id: '26', value: '26-Double click to set name' }
                ]
              },
              { id: '22', value: '22-Double click to set name' }
            ]
          },
          { id: '18', value: '18-Double click to set name' }
        ]
      },
      {
        id: 'v3',
        value: 'v3',
        children: [
          { id: 'v4', value: 'v4' },
          {
            id: 'v5',
            value: 'v5',
            children: [
              { id: 'v6', value: 'v6' },
              {
                id: 'v7',
                value: 'v7',
                children: [
                  {
                    id: 'v8',
                    value: 'v8',
                    children: [
                      { id: 'v9', value: 'v9' },
                      { id: 'v10', value: 'v10' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];

editMode = true;
isGraphChanged = false;
minCellWidth = 75;
var globalCellArr = {};

/*
    Defines a custom shape for the tree node that includes the
    upper half of the outgoing edge(s).
  */
function TreeNodeShape() {}

TreeNodeShape.prototype = new mxCylinder();
TreeNodeShape.prototype.constructor = TreeNodeShape;

// Defines the length of the upper edge segment.
TreeNodeShape.prototype.segment = 20;

// Needs access to the cell state for rendering
TreeNodeShape.prototype.apply = function(state) {
  mxCylinder.prototype.apply.apply(this, arguments);
  this.state = state;
};

TreeNodeShape.prototype.redrawPath = function(path, x, y, w, h, isForeground) {
  var graph = this.state.view.graph;
  var hasChildren = graph.model.getOutgoingEdges(this.state.cell).length > 0;

  if (isForeground) {
    if (hasChildren) {
      // Painting outside of vertex bounds is used here
      path.moveTo(w / 2, h + this.segment);
      path.lineTo(w / 2, h);
      path.end();
    }
  } else {
    path.moveTo(0, 0);
    path.lineTo(w, 0);
    path.lineTo(w, h);
    path.lineTo(0, h);
    path.close();
  }
};

mxCellRenderer.registerShape('treenode', TreeNodeShape);

// Defines a custom perimeter for the nodes in the tree
mxGraphView.prototype.updateFloatingTerminalPoint = function(
  edge,
  start,
  end,
  source
) {
  var pt = null;

  if (source) {
    pt = new mxPoint(
      start.x + start.width / 2,
      start.y + start.height + TreeNodeShape.prototype.segment
    );
  } else {
    pt = new mxPoint(start.x + start.width / 2, start.y);
  }

  edge.setAbsoluteTerminalPoint(pt, source);
};

// Program starts here. Creates a sample graph in the
// DOM node with the specified ID. This function is invoked
// from the onLoad event handler of the document (see below).
function main() {
  // Checks if browser is supported
  if (!mxClient.isBrowserSupported()) {
    // Displays an error message if the browser is
    // not supported.
    mxUtils.error('Browser is not supported!', 200, false);
  } else {
    // Sets the collapse and expand icons. The values below are the default
    // values, but this is how to replace them if you need to.
    mxGraph.prototype.collapsedImage = new mxImage(
      mxClient.imageBasePath + '/collapsed.gif',
      9,
      9
    );
    mxGraph.prototype.expandedImage = new mxImage(
      mxClient.imageBasePath + '/expanded.gif',
      9,
      9
    );

    // Workaround for Internet Explorer ignoring certain styles
    var container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.overflow = 'hidden';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.right = '0px';
    container.style.bottom = '0px';

    var outline = document.getElementById('outlineContainer');

    if (mxClient.IS_IE) {
      new mxDivResizer(container);
      new mxDivResizer(outline);
    }

    document.body.appendChild(container);

    // Creates the graph inside the given container
    var graph = new mxGraph(container);

    // Avoids overlap of edges and collapse icons
    graph.keepEdgesInBackground = true;

    // Set some stylesheet options for the visual appearance
    var style = graph.getStylesheet().getDefaultVertexStyle();
    style[mxConstants.STYLE_SHAPE] = 'treenode';
    style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
    style[mxConstants.STYLE_SHADOW] = true;

    style = graph.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
    style[mxConstants.STYLE_ROUNDED] = true;

    // Enables automatic sizing for vertices after editing and
    // panning by using the left mouse button.
    graph.setAutoSizeCells(true);
    graph.setPanning(true);
    graph.panningHandler.useLeftButtonForPanning = true;

    // Stops editing on enter or escape keypress
    var keyHandler = new mxKeyHandler(graph);

    // Creates the outline (navigator, overview) for moving
    // around the graph in the top, right corner of the window.
    var outln = new mxOutline(graph, outline);

    // Enables automatic layout on the graph and installs
    // a tree layout for all groups who's children are
    // being changed, added or removed.
    var layout = new mxCompactTreeLayout(graph, false);
    layout.useBoundingBox = false;
    layout.edgeRouting = false;
    layout.levelDistance = 30;
    layout.nodeDistance = 10;

    var layoutMgr = new mxLayoutManager(graph);

    layoutMgr.getLayout = function(cell) {
      if (cell.getChildCount() > 0) {
        return layout;
      }
    };

    // Disallow any selections
    graph.setCellsSelectable(false);

    graph.addListener(mxEvent.CLICK, function(sender, evt) {
      var cell = evt.getProperty('cell');
      if (cell && cell.vertex) {
        const nodeData = hierarchialData(graph, cell);
        console.log('cellInfo => ', JSON.stringify(nodeData));
        console.log(
          'parentInfo => ',
          JSON.stringify(getParentCell(cell).value)
        );
      }
    });

    // Defines the condition for showing the folding icon
    graph.isCellFoldable = function(cell) {
      return this.model.getOutgoingEdges(cell).length > 0;
    };

    // Defines the position of the folding icon
    graph.cellRenderer.getControlBounds = function(state) {
      if (state.control != null) {
        var oldScale = state.control.scale;
        var w = state.control.bounds.width / oldScale;
        var h = state.control.bounds.height / oldScale;
        var s = state.view.scale;

        return new mxRectangle(
          state.x + state.width / 2 - (w / 2) * s,
          state.y +
            state.height +
            TreeNodeShape.prototype.segment * s -
            (h / 2) * s,
          w * s,
          h * s
        );
      }

      return null;
    };

    // Implements the click on a folding icon
    graph.foldCells = function(collapse, recurse, cells) {
      this.model.beginUpdate();
      try {
        toggleSubtree(this, cells[0], !collapse);
        this.model.setCollapsed(cells[0], collapse);

        // Executes the layout for the new graph since
        // changes to visiblity and collapsed state do
        // not trigger a layout in the current manager.
        layout.execute(graph.getDefaultParent());
      } finally {
        this.model.endUpdate();
      }
    };

    plotVertices(graph);
    toolsBar(graph);
  }
}

function hierarchialData(graph, cell) {
  globalCellArr = {};
  flattenCells(graph, cell);
  flattenToHierarchial(globalCellArr[cell.id]);
  return [globalCellArr[cell.id]];
}

function flattenToHierarchial(node) {
  _.map(node.children, data => {
    if (globalCellArr[data.id]) {
      data.children = globalCellArr[data.id].children;
      flattenToHierarchial(globalCellArr[data.id]);
    }
  });
}

function getParentCell(cell) {
  if (cell.vertex) {
    return cell.edges[0].source;
  }
  return '';
}

function plotVertices(graph) {
  if (editMode) {
    graph.setConnectable(true);
    graph.setAllowDanglingEdges(false);
    mxConnectionHandler.prototype.connectImage = new mxImage(
      editorsPath + 'images/connector.gif',
      16,
      16
    );

    mxConnectionHandler.prototype.validateConnection = function(
      source,
      target
    ) {
      var sourceParentCell = getParentCell(source);
      return sourceParentCell == target ? false : null;
    };

    mxConnectionHandler.prototype.connect = function(
      source,
      target,
      evt,
      dropTarget
    ) {
      var sourceParentCell = getParentCell(source);
      if (sourceParentCell !== target) {
        graph.getModel().beginUpdate();
        try {
          let sourceCopy = source.clone();
          var edges = graph.getEdgesBetween(sourceParentCell, sourceCopy);
          _.each(edges, edge => {
            graph.getModel().remove(edge);
          });
          graph.removeCells([source]);
          graph.insertEdge(parent, null, '', target, sourceCopy);
        } finally {
          graph.getModel().endUpdate();
        }
      }
    };
  }
  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  // Adds the root vertex of the tree
  graph.getModel().beginUpdate();
  try {
    var w = graph.container.offsetWidth;
    var parent = graph.getDefaultParent();
    console.log('apiData => ', JSON.stringify(apiData));
    createVertex(graph, w, parent, apiData);
  } finally {
    // Updates the display
    graph.getModel().endUpdate();
  }
}

function createVertex(graph, w, parent, apiData, parentNode = '') {
  _.each(apiData, function(cell) {
    const { id, value } = cell;
    let width = 0;
    let height = 0;
    let insertEdge = true;

    if (id == 'rootNode') {
      width = w / 2 - 30;
      height = 20;
      insertEdge = false;
    }

    const node = graph.insertVertex(parent, id, value, width, height, 100, 30);
    updateCellSize(graph, node);

    if (insertEdge) {
      graph.insertEdge(parent, null, '', parentNode, node);
      addOverlays(graph, node, editMode);
    }

    if (cell.children && cell.children.length) {
      createVertex(graph, w, parent, cell.children, node);
    }
  });
}

function toolsBar(graph) {
  var undoManager = new mxUndoManager();
  var listener = function(sender, evt) {
    undoManager.undoableEditHappened(evt.getProperty('edit'));
  };
  graph.getModel().addListener(mxEvent.UNDO, listener);
  graph.getView().addListener(mxEvent.UNDO, listener);

  var content = document.createElement('div');
  content.style.padding = '4px';

  var tb = new mxToolbar(content);

  tb.addItem('Zoom In', imagePath + 'zoom_in32.png', function(evt) {
    graph.zoomIn();
  });

  tb.addItem('Zoom Out', imagePath + 'zoom_out32.png', function(evt) {
    graph.zoomOut();
  });

  tb.addItem('Actual Size', imagePath + 'view_1_132.png', function(evt) {
    graph.zoomActual();
  });

  tb.addItem('Save to Database', imagePath + 'save.png', function(evt) {
    isGraphChanged = false;
    parseXmlJSON(graph);
    var nodes = getNodesFrom(graph);
    console.log('nodes => ', nodes);
  });

  tb.addItem('Edit Graph', imagePath + 'edit.png', function(evt) {
    if (isGraphChanged) {
      alert('There are un-saved information, please save and proceed');
    } else {
      graph.removeCells(graph.getChildVertices(graph.getDefaultParent()));
      editMode = !editMode;
      plotVertices(graph);
    }
  });

  tb.addItem('Poster Print', imagePath + 'print32.png', function(evt) {
    var pageCount = mxUtils.prompt('Enter maximum page count', '1');

    if (pageCount != null) {
      var scale = mxUtils.getScaleForPageCount(pageCount, graph);
      mxPrintPreview.prototype.marginTop = 30;
      mxPrintPreview.prototype.marginBottom = 30;
      mxPrintPreview.prototype.x0 = 10;
      mxPrintPreview.prototype.y0 = 10;

      var preview = new mxPrintPreview(graph, scale);
      preview.open();
    }
  });

  tb.addItem('Undo', imagePath + 'undo-icon.png', function(evt) {
    undoManager.undo();
  });

  tb.addItem('Redo', imagePath + 'redo-icon.png', function(evt) {
    undoManager.redo();
  });

  wnd = new mxWindow('Tools', content, 0, 0, 320, 66, false);
  wnd.setMaximizable(false);
  wnd.setScrollable(false);
  wnd.setResizable(false);
  wnd.setVisible(true);
}

function flattenCells(graph, cell) {
  globalCellArr[cell.id] = { id: cell.id, value: cell.value };

  var outgoingEdges = graph.getOutgoingEdges(cell);

  if (outgoingEdges.length) {
    globalCellArr[cell.id].children = [];
  }

  _.each(outgoingEdges, vertex => {
    const target = vertex.target;
    globalCellArr[cell.id].children.push({
      id: target.id,
      value: target.value
    });

    if (graph.getOutgoingEdges(target).length) {
      flattenCells(graph, target);
    }
  });
}

// Updates the visible state of a given subtree taking into
// account the collapsed state of the traversed branches
function toggleSubtree(graph, cell, show) {
  show = show != null ? show : true;
  var cells = [];

  graph.traverse(cell, true, function(vertex) {
    if (vertex != cell) {
      cells.push(vertex);
    }

    // Stops recursion if a collapsed cell is seen
    return vertex == cell || !graph.isCellCollapsed(vertex);
  });

  graph.toggleCells(show, cells, true);
}

function addOverlays(graph, cell, addDeleteIcon) {
  if (editMode) {
    var overlay = new mxCellOverlay(
      new mxImage(imagePath + 'add.png', 16, 16),
      'Add child'
    );
    overlay.cursor = 'hand';
    overlay.align = mxConstants.ALIGN_CENTER;
    overlay.addListener(
      mxEvent.CLICK,
      mxUtils.bind(this, function(sender, evt) {
        addChild(graph, cell);
      })
    );

    graph.addCellOverlay(cell, overlay);

    if (addDeleteIcon) {
      overlay = new mxCellOverlay(
        new mxImage(imagePath + 'close.png', 20, 20),
        'Delete'
      );
      overlay.cursor = 'hand';
      overlay.offset = new mxPoint(-0, 2);
      overlay.align = mxConstants.ALIGN_RIGHT;
      overlay.verticalAlign = mxConstants.ALIGN_TOP;
      overlay.addListener(
        mxEvent.CLICK,
        mxUtils.bind(this, function(sender, evt) {
          deleteSubtree(graph, cell);
        })
      );
      graph.addCellOverlay(cell, overlay);
    }
  }

  graph.cellLabelChanged = function(cell, newValue, autoSize) {
    graph.model.setValue(cell, newValue);
    updateCellSize(graph, cell);
  };
}

function updateCellSize(graph, cell) {
  graph.updateCellSize(cell, true);
  var geometry = graph.getModel().getGeometry(cell);
  // Updates the geometry of the vertex with the
  // preferred size computed in the graph
  var size = graph.getPreferredSizeForCell(cell);
  size.width = size.width < minCellWidth ? minCellWidth : size.width;
  geometry.width = size.width + 10;
  geometry.height = size.height + 10;
}

function addChild(graph, cell) {
  isGraphChanged = true;
  var model = graph.getModel();
  var parent = graph.getDefaultParent();
  var vertex;

  model.beginUpdate();
  try {
    var w = graph.container.offsetWidth;
    vertex = graph.insertVertex(
      parent,
      null,
      'Double click to set name',
      w / 2 - 30,
      20,
      100,
      30
    );

    var geometry = model.getGeometry(vertex);

    // Updates the geometry of the vertex with the
    // preferred size computed in the graph
    var size = graph.getPreferredSizeForCell(vertex);
    geometry.width = size.width + 10;
    geometry.height = size.height + 10;

    // Adds the edge between the existing cell
    // and the new vertex and executes the
    // automatic layout on the parent
    var edge = graph.insertEdge(parent, null, '', cell, vertex);

    // Configures the edge label "in-place" to reside
    // at the end of the edge (x = 1) and with an offset
    // of 20 pixels in negative, vertical direction.
    edge.geometry.x = 1;
    edge.geometry.y = 0;
    edge.geometry.offset = new mxPoint(0, -20);
    addOverlays(graph, vertex, true);
  } finally {
    model.endUpdate();
  }
  return vertex;
}

function deleteSubtree(graph, cell) {
  isGraphChanged = true;
  // Gets the subtree from cell downwards
  var cells = [];
  graph.traverse(cell, true, function(vertex) {
    cells.push(vertex);
    return true;
  });

  graph.removeCells(cells);
}
