Ext.override(Ext.data.ServerProxy, {

	/**
     * @private
     * Copy any sorters, filters etc into the params so they can be sent over the wire
     */
    getParams: function(params, operation) {
        params = params || {};
        
        var group       = operation.group,
            sorters     = operation.sorters,
            filters     = operation.filters,
            page        = operation.page,
            start       = operation.start,
            limit       = operation.limit,
            
            pageParam   = this.pageParam,
            startParam  = this.startParam,
            limitParam  = this.limitParam,
            groupParam  = this.groupParam,
            sortParam   = this.sortParam,
            filterParam = this.filterParam;
        
        if (pageParam && page) {
            params[pageParam] = page;
        }
        //CHANGE HERE
        if (startParam && (start || start == 0)) {
            params[startParam] = start;
        }
        
        if (limitParam && limit) {
            params[limitParam] = limit;
        }
        
        if (groupParam && group && group.field) {
            params[groupParam] = this.encodeGroupers(group);
        }
        
        if (sortParam && sorters && sorters.length > 0) {
            params[sortParam] = this.encodeSorters(sorters);
        }
        
        if (filterParam && filters && filters.length > 0) {
            params[filterParam] = this.encodeFilters(filters);
        }
        
        return params;
    }
	
});