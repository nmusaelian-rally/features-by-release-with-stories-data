Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },

    addContent: function() {
        this._makeStore();
    },
    
    _makeStore: function(){
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            fetch: ['FormattedID','Name','State','Priority'],
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
   onScopeChange: function() {
        this._makeStore();
    },
    
    _onDataLoaded: function(store, data){
                var features = [];
                var pendingstories = data.length;
                if (data.length ===0) {
                        this._createGrid(features);  //to force refresh on grid when there are no features in release
                }
                _.each(data, function(feature) {
                            var f  = {
                                FormattedID: feature.get('FormattedID'),
                                Name: feature.get('Name'),
                                _ref: feature.get("_ref"),
                                State: (feature.get("State") && feature.get("State") .Name) || 'None',
                                Priority: feature.get("Priority") || 'None',
                                UserStories: []
                            };
                        var stories = feature.getCollection('UserStories', {fetch: ['FormattedID','ScheduleState','Owner']});
                           stories.load({
                                callback: function(records, operation, success){
                                    _.each(records, function(story){
                                        f.UserStories.push({
                                            _ref: story.get('_ref'),
                                            FormattedID: story.get('FormattedID'),
                                            ScheduleState: story.get('ScheduleState'),
                                            Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None'
                                        });
                                    }, this);
                                    
                                    --pendingstories;
                                    if (pendingstories === 0) {
                                        this._createGrid(features);
                                    }
                                },
                                scope: this
                            });
                            features.push(f);
                }, this);
    },
    
    _createGrid: function(features) {
        var featureStore = Ext.create('Rally.data.custom.Store', {
                data: features,
                pageSize: 100,
                remoteSort:false,
                groupField: 'Priority'
            });
        
        if (!this.down('#fgrid')){
         this.add({
            xtype: 'rallygrid',
            itemId: 'fgrid',
            store: featureStore,
            features: [{ftype:'groupingsummary'}],
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'State', dataIndex: 'State'
                },
                {
                    text: 'Priority', dataIndex: 'Priority'
                },
                {
                    text: 'User Stories', dataIndex: 'UserStories', flex: 1,
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(userstory){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(userstory) + '">' + userstory.FormattedID + '</a>' + ' ScheduleState: ' + userstory.ScheduleState + ' Owner: ' + userstory.Owner);
                        });
                        return html.join('<br />');
                    }
                }
            ]
            
        });
        }
        else{
            this.down('#fgrid').reconfigure(featureStore);
        }
    }
       
});
