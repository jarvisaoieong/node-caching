module.exports = function Caching(store) {
	store = store || 'memory';
	
	if (typeof store == 'string') {
		try {
			store = require('./stores/'+store.toLowerCase().trim())(arguments[1]);
		} catch(e) {
			throw new Error('There is no bundled caching store named "'+store+'"');
		}
	}

	var queues = {};

	var cacher = function(key, ttl, work, done) {
		if (typeof ttl == 'number') {
			forceUpdate = false
		} else {
			forceUpdate = ttl.forceUpdate
			ttl = ttl.ttl
		}

		store.get(key, function(err, args) {
			if (!err && args && !forceUpdate) {
				done.apply(null, args);
			} else if (queues[key] && !forceUpdate) {
				queues[key].push(done);
			} else {
				queues[key] = [done];
				work(function(){
					var args = Array.prototype.slice.call(arguments, 0);
					store.set(key, ttl, args);		
					queues[key].forEach(function(done){
						done.apply(null, args);
					});
					delete queues[key];
				});
			}
		});
	};
	cacher.cache = cacher;
	cacher.remove = store.remove.bind(store);
	cacher.store = store;

	return cacher;
};