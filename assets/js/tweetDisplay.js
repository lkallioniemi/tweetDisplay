(function( $ ) {
	var defaults = {
		'request' : '@franticcom',
		'numberOfTweets' : 5,
		'filter' : {
			'mtv3uutiset' : ["mtv3uutiset","MattiMaunu"],
			'politiikka' : ["mtv3politiikka","MattiMaunu","Mari_Haavisto","JussiKarki","TimoHaapala","EevaLehtimaki","VesaKallionpaa","NurminenTapio","Raimop"],
			'urheilu' : ["JariPorttila","UotilaMTV3","OskariSaari","PanuMarkkanen","KimmoPorttila","SebastianWaheeb"]
		}
	};
	var parentElement;
	var ify = {
		link: function(tweet) {
			return tweet.replace(/\b(((https*\:\/\/)|www\.)[^\"\']+?)(([!?,.\)]+)?(\s|$))/g, function(link, m1, m2, m3, m4) {
				var http = m2.match(/w/) ? 'http://' : '';
				return '<a class="twtr-hyperlink" target="_blank" href="' + http + m1 + '" onClick="sendLinkClick(\'twitter_link\')">' + ((m1.length > 25) ? m1.substr(0, 24) + '…' : m1) + '</a>' + m4;
			});
		},
		at: function(tweet) {
			return tweet.replace(/\B[@?]([a-zA-Z0-9_]{1,20})/g, function(m, username) {
				return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/intent/user?screen_name=' + username + '" onClick="sendLinkClick(\'twitter_user\')">@' + username + '</a>';
			});
		},
		list: function(tweet) {
			return tweet.replace(/\B[@?]([a-zA-Z0-9_]{1,20}\/\w+)/g, function(m, userlist) {
				return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/' + userlist + '" onClick="sendLinkClick(\'twitter_reply\')">@' + userlist + '</a>';
			});
		},
		hash: function(tweet) {
			return tweet.replace(/(^|\s+)#(\w+)/gi, function(m, before, hash) {
				return before + '<a target="_blank" class="twtr-hashtag" href="http://twitter.com/search?q=%23' + hash + '" onClick="sendLinkClick(\'twitter_hashtag\')">#' + hash + '</a>';
			});
		},
		clean: function(tweet) {
			return this.hash(this.at(this.list(this.link(tweet))));
		}
	};
	var timeAgo = function(dateString) {
		var rightNow = new Date();
		var then = new Date(dateString);
		if ($.browser.msie) {
			// IE can't parse these crazy Ruby dates
			then = new Date(Date.parse(dateString.replace(/( \+)/, ' UTC$1')));
		}
		var diff = rightNow - then;
		var second = 1000, minute = 60000, hour = 3600000, day = 86400000, week = 604800000;
		if (isNaN(diff) || diff < 0) {
			return ""; // return blank string if unknown
		}
		if (diff < hour) {
			return Math.floor(diff / minute) + " min";
		}
		if (diff < day) {
			return  Math.floor(diff / hour) + " h";
		}
		if (diff > day && diff < day * 2) {
			return "eilen";
		}
		else {
			return then.getDate() + "." + (then.getMonth()+1) + ".";
		}
	};
	var helpers = {
		_initStorage : function(){
			try {
				return ('localStorage' in window) && localStorage !== null;
			} catch (e) {
				return false;
			}
		},
		_displayTweets : function (tweets){
			if (helpers._initStorage()) { 
				tweets = JSON.parse(localStorage.getItem("tweet_items_"+defaults.request));
			}
			$(parentElement).html('<h6>Twitter<span class="request">'+defaults.request+'</span><span class="logo"></span></h6>');
			if (tweets.results) { tweets = tweets.results }
			var count = 0;
			$.each(tweets, function(index, value){
				if (defaults.request.match(/^#/)) {
					if ($.inArray(value.from_user, defaults.filter[defaults.request.substring(1)])>-1 && count < defaults.numberOfTweets){
						parentElement.append('<div class="tweet"><span class="time">'+timeAgo(value.created_at)+'</span><div class="meta"><span class="image"><img src="'+value.profile_image_url+'" alt="'+value.from_user_name+'"></span><a href="http://www.twitter.com/'+value.from_user+'" class="handle" onClick="sendLinkClick(\'twitter_sender\')">'+value.from_user+'</a><span class="name">'+value.from_user_name+'</span></div><span class="content">'+ify.clean(value.text)+'</span> </div>');
						count++;
					}
				} else {
					parentElement.append('<div class="tweet"><span class="time">'+timeAgo(value.created_at)+'</span><div class="meta"><span class="image"><img src="'+value.profile_image_url+'" alt="'+value.from_user_name+'" onClick="sendLinkClick(\'twitter_sender\')"></span><a href="http://www.twitter.com/'+value.from_user+'" class="handle">@'+value.from_user+'</a><span class="name">'+value.from_user_name+'</span></div><span class="content">'+ify.clean(value.text)+'</span> </div>');
				}
			});
		},
		_loadTweets : function(){
			clearTimeout('timeout');
			var data;
			var url = "http://search.twitter.com/search.json";
			if (defaults.request.match(/^#/)) {
				data = {
					'q': defaults.request.replace(/^#/,'%23'),
					'count' : '100',
					'result_type' : 'resent'
				}
			} else {
				data = { 
					'q' : "from:"+defaults.request.replace(/^@/,''),
					'count' : '100',
					'result_type' : 'resent'
				};
			}
			
			
			if (helpers._initStorage()) { 
				d = new Date();
				time = localStorage.getItem("twitter_time_"+defaults.request);
				if (time === null || (30000+parseInt(time)) < d.getTime()) { 
					localStorage.setItem("twitter_time_"+defaults.request, d.getTime());
					$.ajax({
						url: url,
						type: 'GET',
						dataType: 'jsonp',
						data: data,
						success: function(data, textStatus, xhr) {
							if (helpers._initStorage()) {
								if (data != "") localStorage.setItem("tweet_items_"+defaults.request, JSON.stringify(data));
								helpers._displayTweets();
							} else {
								helpers._displayTweets(data);
							}
						},
						complete: function(jqxhr) {
							helpers._displayTweets(data);
						}
					});
				} else { helpers._displayTweets(); }
			} else { 
				$.ajax({
					url: url,
					type: 'GET',
					dataType: 'jsonp',
					data: data,
					success: function(data, textStatus, xhr) {
						helpers._displayTweets(data);
					}
				});
			}
		}
	}

	var methods = {
		init : function(options){
			parentElement = $(this);
			var settings = $.extend( defaults, options);
			helpers._loadTweets();
			window.setInterval(function(){helpers._loadTweets();},30000);
		}
	}

	$.fn.tweetDisplay = function(method) {
		var localStorage = '';
		// Method calling logic
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on tweetDisplay' );
		};
	};
})( jQuery );