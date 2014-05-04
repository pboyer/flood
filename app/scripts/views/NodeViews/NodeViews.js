define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'CSGNodeView'], function(BaseNodeView, WatchNodeView, NumNodeView, CSGNodeView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = BaseNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;

  nodeViewTypes.Sphere = CSGNodeView;
  nodeViewTypes.Cylinder = CSGNodeView;
  nodeViewTypes.Cube = CSGNodeView;
  nodeViewTypes.UnionSolids = CSGNodeView;
  nodeViewTypes.IntersectSolids = CSGNodeView;
  nodeViewTypes.SubtractSolid = CSGNodeView;

  return nodeViewTypes;

});