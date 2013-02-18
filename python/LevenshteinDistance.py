'''
File: LevenshteinDistance.py
Author: Me
Description: 
'''
import collections
import functools

class memoized(object):
   '''Decorator. Caches a function's return value each time it is called.
   If called later with the same arguments, the cached value is returned
   (not reevaluated).
   '''
   def __init__(self, func):
      self.func = func
      self.cache = {}
   def __call__(self, *args):
      if not isinstance(args, collections.Hashable):
         # uncacheable. a list, for instance.
         # better to not cache than blow up.
         return self.func(*args)
      if args in self.cache:
         return self.cache[args]
      else:
         value = self.func(*args)
         self.cache[args] = value
         return value
   def __repr__(self):
      '''Return the function's docstring.'''
      return self.func.__doc__
   def __get__(self, obj, objtype):
      '''Support instance methods.'''
      return functools.partial(self.__call__, obj)

def LevenshteinDistance(str1, i, len1, str2, j, len2):
    if(len1 == 0): return len2
    if(len2 == 0): return len1
    cost = 0
    if(str1[i] != str2[j]): cost = 1

    dist = min(
        LevenshteinDistance(str1, i+1,len1-1, str2,j,len2)+1, 
        LevenshteinDistance(str1,i,len1,str2,j+1,len2-1)+1,
        LevenshteinDistance(str1,i+1,len1-1,str2,j+1,len2-1)+cost)
    return dist



@memoized
def editdistance(str1, str2):
    # trivial solutions
    if(len(str1) == 0): return len(str2)  # edit distance is len(str2) additions
    if(len(str2) == 0): return len(str1)  # edit distance is len(str1) deletions
    if(str1 == str2): return 0  # edit distance is zero for identical strings

    # recursive call based on first character
    if(str1[0] == str2[0]):
        cost = 0;
    else:
        cost = 1;

    dist = min(editdistance(str1[1:], str2[1:]) + cost,
        editdistance(str1, str2[1:]) + 1,
        editdistance(str1[1:], str2) + 1)

    return dist

def match(str1, str2):
    # trivial solutions
    if(len(str1) == 0): return 0  
    if(len(str2) == 0): return 0  
    if(str1 == str2): return len(str1)  

    # recursive call based on first character
    if(str1[0] == str2[0]):
        cost = 1;
    else:
        cost = 0;

    dist = max(match(str1[1:], str2[1:]) + cost,
        match(str1, str2[1:]),
        match(str1[1:], str2))

    return dist

def match2(str1, str2):
    # trivial solutions
    if(len(str1) == 0): return 0  
    if(len(str2) == 0): return 0  
    if(str1 == str2): return len(str1)  

    # recursive call based on first character
    if(str1[0] == str2[0]):
        return 1 + match2(str1[1:],str2[1:])
    else:
        return max(match2(str1[1:], str2[1:]),
            match2(str1, str2[1:]),
            match2(str1[1:], str2))


def main():
    print(editdistance('aaxxxxxxxxxxxxxxbbyycc',
                       'aasssbbtttttttttttttcc'))
    #print(memoizedmatch('aaxxxxxxxxxxxxxxbbyycc',
                       #'aasssbbtttttttttttttcc'))
    #print("chache size: " + len(memoizedmatch.cache))
    #memoizedmatch2 = memoized(match2)
    #print(match2('aaxxxxxxxxxxxxxxbbyycc',
                       #'aasssbbtttttttttttttcc'))

    #print(match('aaxxxxxxxxxxxxxxbbyyycc',
                       #'aayyybbtttttttttttttcc'))
    #print(match2('aaxxxxxxxxxxxxxxbbyyycc',
                       #'aayyybbtttttttttttttcc'))

if __name__ == '__main__':
    memoizedmatch = memoized(match)



