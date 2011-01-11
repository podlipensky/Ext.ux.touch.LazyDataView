/**
 * @author Pavel Podlipensky - http://podlipensky.com
 * @class LazyAbstractStoreSelectionModel
 */
Ext.namespace('Ext.ux.touch');

Ext.ux.touch.LazyDataViewSelectionModel = Ext.extend(Ext.DataViewSelectionModel, {
			doSelect : function(records, keepExisting, suppressEvent) {
				if (this.locked) {
					return;
				}
				if (Ext.isNumber(records)) {
					var count = this.store.getCount();
					if (count < (records + 1)) {
						var pageSize = this.store.pageSize;
						//load always one page ahead in order to keep usability
						var pageIndex = Math.floor(records / pageSize) + (!!(records % pageSize) ? 1 : 0) + 1;
						var currentPage = this.store.currentPage;
						this.store.currentPage = pageIndex;
						var callback = Ext.createDelegate(this.doSelect, this, [records, keepExisting, suppressEvent]);
						this.store.on('load', callback, this, { single : true });
						this.store.read({
									page : pageIndex,
									start : currentPage * pageSize,
									limit : (pageIndex - currentPage) * pageSize,
									addRecords : !this.clearOnPageLoad
								});
						return;
					}
				}
				Ext.ux.touch.LazyDataViewSelectionModel.superclass.doSelect.apply(this, arguments);
			}
		})