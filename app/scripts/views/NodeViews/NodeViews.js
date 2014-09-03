define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'ThreeCSGNodeView', 'FormulaView', 'OutputView', 'InputView','CustomNodeView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, ThreeCSGNodeView, FormulaView, OutputView, InputView, CustomNodeView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = ThreeCSGNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Formula = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});