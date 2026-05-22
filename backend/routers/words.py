import random
from fastapi import APIRouter, Query

router = APIRouter(prefix="/words", tags=["words"])

# ── Word lists ──────────────────────────────────────────

COMMON_100 = (
    "the be to of and a in that have I it for not on with he as you do at this "
    "but his by from they we say her she or an will my one all would there their "
    "what so up out if about who get which go me when make can like time no just "
    "him know take people into year your good some could them see other than then "
    "now look only come its over think also back after use two how our work first "
    "well way even new want because any these give day most us"
).split()

COMMON_200 = COMMON_100 + (
    "find here thing many well still between life being under never day same another "
    "know place school every hand high keep end point home move try night might close "
    "seem open begin both next own while order line eye door world long state change "
    "interest public run help turn ask follow came around house form small number off "
    "part must head old play since large system set against put big problem however "
    "late those hold become few such show leave call group often last develop present "
    "talk without young general program face leave mean real little become fact child "
    "feel word side old man right need company important area work during before few "
    "great country consider write more start those upon city almost tell why far away "
    "again read name should school plan run ask able idea move story early increase "
    "possible above second enough grow class land mark person year lead thought case "
    "body remain believe happen question work week hold stand"
).split()

CODE_WORDS = (
    "function return const let var if else for while do switch case break continue "
    "class extends constructor super this new delete typeof instanceof import export "
    "default from async await try catch finally throw true false null undefined void "
    "yield static get set public private protected interface type enum implements "
    "abstract override readonly namespace module declare require global process "
    "console log error debug info warn map filter reduce forEach find findIndex "
    "indexOf includes push pop shift unshift splice slice concat join sort reverse "
    "length toString valueOf keys values entries freeze assign create defineProperty "
    "promise resolve reject then catch all race any finally fetch request response "
    "json parse stringify encode decode buffer stream read write open close listen "
    "connect send receive emit on once off remove add update delete insert select "
    "query execute commit rollback transaction schema model migrate seed validate "
    "serialize deserialize render component mount unmount state props context hook "
    "effect ref memo callback reducer action dispatch store provider consumer"
).split()

QUOTES = [
    "the only way to do great work is to love what you do",
    "in the middle of difficulty lies opportunity",
    "life is what happens when you are busy making other plans",
    "the future belongs to those who believe in the beauty of their dreams",
    "it does not matter how slowly you go as long as you do not stop",
    "the best time to plant a tree was twenty years ago the second best time is now",
    "your time is limited so do not waste it living someone else life",
    "strive not to be a success but rather to be of value",
    "the mind is everything what you think you become",
    "an unexamined life is not worth living",
    "the only impossible journey is the one you never begin",
    "turn your wounds into wisdom",
    "believe you can and you are halfway there",
    "what we achieve inwardly will change outer reality",
    "happiness is not something ready made it comes from your own actions",
    "everything you have ever wanted is on the other side of fear",
    "do what you can with what you have where you are",
    "success is not final failure is not fatal it is the courage to continue that counts",
    "if you look at what you have in life you will always have more",
    "it is during our darkest moments that we must focus to see the light",
    "the purpose of our lives is to be happy",
    "life is really simple but we insist on making it complicated",
    "you only live once but if you do it right once is enough",
    "get busy living or get busy dying",
    "many of life failures are people who did not realize how close they were to success",
    "if you want to live a happy life tie it to a goal not to people or things",
    "never let the fear of striking out keep you from playing the game",
    "love the life you live and live the life you love",
    "life is either a daring adventure or nothing at all",
    "you miss one hundred percent of the shots you do not take",
]

WORD_LISTS = {
    "common100": COMMON_100,
    "common200": COMMON_200,
    "code": CODE_WORDS,
}


@router.get("/")
def get_words(
    mode: str = Query("common200", description="Word list: common100, common200, code, quotes"),
    count: int = Query(30, ge=5, le=200, description="Number of words to return"),
):
    if mode == "quotes":
        # Serve a random quote (split into words)
        quote = random.choice(QUOTES)
        return {"mode": mode, "words": quote.split()}

    word_list = WORD_LISTS.get(mode, COMMON_200)
    words = [random.choice(word_list) for _ in range(count)]
    return {"mode": mode, "words": words}
