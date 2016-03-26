Vue.directive('select2', {
  twoWay: true,
  params: ['options'],
  bind: function () {
    var _this = this;
    _this.$el = $(_this.el);
    _this.$el
      .select2({data:this.params.options})
      .on('change', function (e) {
        _this.set(_this.$el.val());
      });

  },
  update: function (newValue, oldValue) {
    this.$el.val(null).val(newValue).trigger('change');
  },
  unbind: function () {
    this.$el.select2('destroy');
  }
});
