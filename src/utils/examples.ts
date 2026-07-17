export interface AssemblyExample {
  name: string;
  description: string;
  code: string;
}

export const examples: AssemblyExample[] = [
  {
    name: '16-bit Addition',
    description: 'Adds two 16-bit registers (AX and BX) and stores the result in memory (data segment).',
    code: `; 16-bit Addition Example
org 100h

; Initialize DS
mov ax, ds
mov ds, ax

; Perform Addition
mov ax, 1234h      ; Load first value into AX
mov bx, 0ABCDh      ; Load second value into BX
add ax, bx          ; Add BX to AX (Result is in AX)

; Store result in memory variable
mov [sum], ax

; Print message using DOS interrupt
mov dx, offset msg
mov ah, 09h
int 21h

hlt                 ; Halt execution

; Data Segment
sum dw 0
msg db 'Addition completed successfully!$'
`
  },
  {
    name: 'Find Largest in Array',
    description: 'Iterates through an array of numbers in the data segment and finds the maximum value.',
    code: `; Find Largest Element in an Array
org 100h

mov cx, 5          ; Set counter (number of elements)
mov si, offset arr ; Load SI with array offset
mov al, [si]       ; AL will hold the maximum, initialize with first element

search_loop:
inc si             ; Point to next element
cmp [si], al       ; Compare current element with AL (max)
jbe skip           ; If current <= max, skip update
mov al, [si]       ; Update AL with new max

skip:
loop search_loop   ; Decrement CX, repeat loop if CX != 0

mov [max_val], al  ; Store max value in memory

; Display completion
mov dx, offset msg
mov ah, 09h
int 21h

hlt

; Data Segment
arr db 12h, 45h, 0AFh, 88h, 23h
max_val db 0
msg db 'Search complete. Max value is stored in max_val.$'
`
  },
  {
    name: 'Factorial of a Number',
    description: 'Computes the factorial of a number N (e.g., 5! = 120 / 78h) using a simple decremental loop.',
    code: `; Factorial of N
org 100h

mov ax, 1          ; Initialize AX = 1 (Factorial result)
mov cx, 5          ; Set N = 5

fact_loop:
mul cx             ; AX = AX * CX
loop fact_loop     ; Decrement CX and repeat while CX > 0

mov [fact_res], ax ; Store result

; Display completion
mov dx, offset msg
mov ah, 09h
int 21h

hlt

; Data Segment
fact_res dw 0
msg db 'Factorial calculation completed.$'
`
  },
  {
    name: 'Fibonacci Series',
    description: 'Generates the first 8 numbers of the Fibonacci series and stores them sequentially in memory.',
    code: `; Fibonacci Series Generator
org 100h

mov cx, 8          ; Generate 8 numbers
mov si, offset fib ; Destination array address

; First two numbers are 0 and 1
mov al, 0
mov [si], al
inc si
mov bl, 1
mov [si], bl
dec cx             ; Count first number
dec cx             ; Count second number

fib_loop:
inc si             ; Move SI to next position
mov al, [si-1]     ; Load term (n-1)
add al, [si-2]     ; Add term (n-2)
mov [si], al       ; Store new term
loop fib_loop      ; Loop until CX = 0

mov dx, offset msg
mov ah, 09h
int 21h

hlt

; Data Segment
fib db 0, 0, 0, 0, 0, 0, 0, 0
msg db 'Fibonacci series generated in memory!$'
`
  },
  {
    name: 'Reverse a String',
    description: 'Reads a string from memory, pushes it character-by-character onto the stack, and pops it back to reverse it.',
    code: `; Reverse a String using Stack
org 100h

mov cx, 5                ; Length of string "HELLO"
mov si, offset original   ; Source pointer

; Push characters onto the stack
push_loop:
mov al, [si]
mov ah, 0                ; Clear AH
push ax                  ; Push 16-bit word (containing char)
inc si
loop push_loop

; Pop characters into reverse destination
mov cx, 5
mov di, offset reversed   ; Destination pointer

pop_loop:
pop ax                   ; Pop 16-bit word
mov [di], al             ; Store AL (character) in destination
inc di
loop pop_loop

; Display results
mov dx, offset original_msg
mov ah, 09h
int 21h

mov dx, offset reversed_msg
mov ah, 09h
int 21h

hlt

; Data Segment
original db 'H', 'E', 'L', 'L', 'O', '$'
reversed db '?', '?', '?', '?', '?', '$'
original_msg db 'Original string: HELLO', 0Dh, 0Ah, '$'
reversed_msg db 'Reversed string: $'
`
  }
];
