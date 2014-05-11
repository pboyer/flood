define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'CSGNodeView', 'FormulaView'], function(BaseNodeView, WatchNodeView, NumNodeView, CSGNodeView, FormulaView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = BaseNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;

  nodeViewTypes.Formula = FormulaView;

  nodeViewTypes.Sphere = CSGNodeView;
  nodeViewTypes.Cylinder = CSGNodeView;
  nodeViewTypes.Cube = CSGNodeView;

  nodeViewTypes.SolidUnion = CSGNodeView;
  nodeViewTypes.SolidUnionAll = CSGNodeView;
  nodeViewTypes.SolidIntersect = CSGNodeView;
  nodeViewTypes.SolidSubtract = CSGNodeView;

  return nodeViewTypes;

});