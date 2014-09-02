define(['BaseNodeView', 'WatchNodeView', 'NumNodeView', 'CSGNodeView', 'FormulaView', 'OutputView', 'InputView','CustomNodeView'], 
  function(BaseNodeView, WatchNodeView, NumNodeView, CSGNodeView, FormulaView, OutputView, InputView, CustomNodeView){

  var nodeViewTypes = {};

  nodeViewTypes.Base = CSGNodeView;
  nodeViewTypes.Watch = WatchNodeView;
  nodeViewTypes.Number = NumNodeView;
  nodeViewTypes.CustomNode = CustomNodeView;

  nodeViewTypes.Formula = FormulaView;
  nodeViewTypes.Input = InputView;
  nodeViewTypes.Output = OutputView;

  return nodeViewTypes;

});