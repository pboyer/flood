define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

	  defaults: {
	  	sections: 
	  		[ { title: "Workspace Tabs",
	  				targetId : "add-workspace-button",
	  				offset: [5, 5],
	  				text: "Switch between or add new active workspaces"
	  			},
	  			{ title: "Node Library",
	  				targetId : "bottom-search",
	  				offset: [5, -110],
	  				text: "This is one place where you can add new nodes.  You can also double click to search"
	  			},
	  			{ title: "3D Focus Control",
	  				targetId : "workspace_hide",
	  				offset: [-170,-100],
	  				text: "Toggle between the 3D view and your workspace"
	  			},
	  			{ title: "Workspace Browser",
	  				targetId : "workspace-browser-button",
	  				offset: [-170,0],
	  				text: "You can find all of your past work in the Workspace Browser"
	  			},
	  			{ title: "Export STL",
	  				targetId : "export-button",
	  				offset: [20,-110],
	  				text: "Export your work for 3D printing by selecting nodes and clicking this button"
	  			},
	  			// { title: "Zoom",
	  			// 	targetId : "zoomreset-button",
	  			// 	offset: [20,-110],
	  			// 	text: "Use this control the workspace zoom, or use Ctrl +, Ctrl -"
	  			// }
	  		]
	  }

	});
});