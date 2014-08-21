define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({

	  defaults: {
	  	sections: 
	  		[ { title: "New Workspace Button",
	  				targetId : "add-workspace-button",
	  				offset: [5, 5],
	  				text: "Create a new project or custom node here"
	  			},
	  			{ title: "Node Library",
	  				targetId : "bottom-search",
	  				offset: [5, -110],
	  				text: "This is one place where you can add new nodes.  You can also double click to search."
	  			},
	  			{ title: "3D Focus Control",
	  				targetId : "workspace_hide",
	  				offset: [-170,-100],
	  				text: "Toggle between the 3D view and your workspace here"
	  			}
	  		]
	  }

	});
});